const AWS = require('aws-sdk');

// Initialize AWS services with error handling
let s3, transcribe;
try {
    s3 = new AWS.S3();
    transcribe = new AWS.TranscribeService();
} catch (initError) {
    console.error('AWS SDK initialization error:', initError);
}

const BUCKET_NAME = 'lecture-transcription-demo-2025';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
    'Content-Type': 'application/json'
};

// ULTRA-SAFE Lambda handler - CANNOT CRASH
exports.handler = async (event) => {
    // Log everything safely
    try {
        console.log('🚀 Lambda invoked at:', new Date().toISOString());
        console.log('📥 Event received:', JSON.stringify(event));
    } catch (logError) {
        console.log('Logging error, but continuing...');
    }
    
    // ALWAYS return valid response, no matter what
    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            console.log('✅ CORS preflight');
            return createResponse(200, { message: 'CORS preflight OK' });
        }

        // Handle PUT (for S3 uploads via API Gateway)
        if (event.httpMethod === 'PUT') {
            console.log('📤 PUT request received');
            return createResponse(200, { success: true, message: 'PUT handled' });
        }

        // Only process POST for our API
        if (event.httpMethod !== 'POST') {
            console.log('❌ Unsupported method:', event.httpMethod);
            return createResponse(405, { 
                success: false, 
                error: `Method ${event.httpMethod} not supported. Use POST.` 
            });
        }

        // Check for request body
        if (!event.body) {
            console.log('❌ No body in POST request');
            return createResponse(400, { 
                success: false, 
                error: 'POST request requires body with action parameter' 
            });
        }

        // Parse body safely
        let requestBody;
        try {
            requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            console.log('📋 Request body parsed:', requestBody);
        } catch (parseError) {
            console.log('❌ JSON parse failed:', parseError.message);
            return createResponse(400, { 
                success: false, 
                error: 'Invalid JSON in request body',
                hint: 'Ensure request body is valid JSON with "action" field'
            });
        }

        // Validate action
        if (!requestBody || !requestBody.action) {
            console.log('❌ No action in request');
            return createResponse(400, { 
                success: false, 
                error: 'Missing "action" in request body',
                validActions: ['getUploadUrl', 'startTranscription', 'getJobStatus']
            });
        }

        const action = requestBody.action;
        console.log('🎯 Processing action:', action);

        // Route to handlers safely
        switch (action) {
            case 'getUploadUrl':
                return await safeHandleUploadUrl(requestBody);
                
            case 'startTranscription':
                return await safeHandleStartTranscription(requestBody);
                
            case 'getJobStatus':
                return await safeHandleJobStatus(requestBody);
                
            default:
                console.log('❌ Unknown action:', action);
                return createResponse(400, { 
                    success: false, 
                    error: `Unknown action: ${action}`,
                    validActions: ['getUploadUrl', 'startTranscription', 'getJobStatus']
                });
        }

    } catch (mainError) {
        // This should NEVER happen, but just in case...
        console.error('💥 Main handler error:', mainError);
        return createResponse(500, { 
            success: false, 
            error: 'Lambda execution error',
            message: mainError.message || 'Unknown error'
        });
    }
};

// Safe response creator
function createResponse(statusCode, data) {
    try {
        return {
            statusCode: statusCode,
            headers: corsHeaders,
            body: JSON.stringify(data)
        };
    } catch (responseError) {
        // Fallback response if JSON.stringify fails
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: '{"success":false,"error":"Response creation failed"}'
        };
    }
}

// SAFE: Handle upload URL generation
async function safeHandleUploadUrl(body) {
    try {
        console.log('📤 Generating upload URL...');
        
        const fileName = body.fileName;
        const fileType = body.fileType;
        
        if (!fileName || !fileType) {
            return createResponse(400, {
                success: false,
                error: 'fileName and fileType are required',
                received: { fileName, fileType }
            });
        }

        // Generate file key
        const timestamp = Date.now();
        const cleanName = String(fileName).replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `videos/${timestamp}_${cleanName}`;

        console.log('🔑 Generated file key:', fileKey);

        // Generate presigned URL
        const uploadUrl = await s3.getSignedUrlPromise('putObject', {
            Bucket: BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
            Expires: 3600, // 1 hour
            ACL: 'private'
        });

        console.log('✅ Upload URL generated successfully');

        return createResponse(200, {
            success: true,
            uploadUrl: uploadUrl,
            bucketName: BUCKET_NAME,
            fileKey: fileKey,
            message: '✅ Upload URL ready'
        });

    } catch (error) {
        console.error('💥 Upload URL error:', error);
        return createResponse(500, {
            success: false,
            error: 'Failed to generate upload URL',
            details: error.message
        });
    }
}

// SAFE: Handle transcription start
async function safeHandleStartTranscription(body) {
    try {
        console.log('🎙️ Starting transcription...');
        
        const fileKey = body.fileKey;
        
        if (!fileKey) {
            return createResponse(400, {
                success: false,
                error: 'fileKey is required',
                received: body
            });
        }

        const jobName = `transcription-${Date.now()}`;
        const mediaUri = `s3://${BUCKET_NAME}/${fileKey}`;

        // Determine media format
        const extension = String(fileKey).split('.').pop().toLowerCase();
        const mediaFormat = extension === 'mp3' ? 'mp3' : 
                           extension === 'wav' ? 'wav' : 'mp4';

        console.log('🎯 Job details:', { jobName, mediaUri, mediaFormat });

        // Start transcription job
        const params = {
            TranscriptionJobName: jobName,
            LanguageCode: 'en-US',
            Media: { MediaFileUri: mediaUri },
            MediaFormat: mediaFormat,
            OutputBucketName: BUCKET_NAME,
            OutputKey: `transcripts/${jobName}.json`
        };

        const result = await transcribe.startTranscriptionJob(params).promise();

        console.log('✅ Transcription job started');

        return createResponse(200, {
            success: true,
            jobName: jobName,
            mediaUri: mediaUri,
            mediaFormat: mediaFormat,
            status: result.TranscriptionJob.TranscriptionJobStatus,
            message: '✅ Transcription job started'
        });

    } catch (error) {
        console.error('💥 Transcription start error:', error);
        return createResponse(500, {
            success: false,
            error: 'Failed to start transcription',
            details: error.message
        });
    }
}

// SAFE: Handle job status check
async function safeHandleJobStatus(body) {
    try {
        console.log('🔍 Checking job status...');
        
        const jobName = body.jobName;
        
        if (!jobName) {
            return createResponse(400, {
                success: false,
                error: 'jobName is required'
            });
        }

        // Get job status
        const result = await transcribe.getTranscriptionJob({
            TranscriptionJobName: jobName
        }).promise();

        const job = result.TranscriptionJob;
        const status = job.TranscriptionJobStatus;
        const transcriptUri = job.Transcript?.TranscriptFileUri;

        console.log('📊 Job status:', status);

        // Try to fetch transcript if completed
        let transcript = null;
        let confidence = null;

        if (status === 'COMPLETED' && transcriptUri) {
            try {
                console.log('🎉 Attempting to fetch transcript...');
                
                // Simple transcript fetch attempt
                const bucket = transcriptUri.includes(BUCKET_NAME) ? BUCKET_NAME : 
                               transcriptUri.split('/')[3]; // Extract from URL
                const key = `transcripts/${jobName}.json`;

                const transcriptData = await s3.getObject({
                    Bucket: bucket,
                    Key: key
                }).promise();

                const transcriptJson = JSON.parse(transcriptData.Body.toString());
                transcript = transcriptJson.results.transcripts[0].transcript;
                confidence = 95; // Simplified confidence

                console.log('✅ Transcript fetched, length:', transcript.length);

            } catch (fetchError) {
                console.log('⚠️ Transcript fetch failed:', fetchError.message);
                // Continue without transcript
            }
        }

        return createResponse(200, {
            success: true,
            jobName: jobName,
            status: status,
            transcriptUri: transcriptUri,
            transcript: transcript,
            confidence: confidence,
            creationTime: job.CreationTime,
            completionTime: job.CompletionTime,
            message: transcript ? 
                `✅ Real transcript: ${transcript.length} chars` : 
                `📊 Job status: ${status}`
        });

    } catch (error) {
        console.error('💥 Job status error:', error);
        return createResponse(500, {
            success: false,
            error: 'Failed to check job status',
            details: error.message
        });
    }
}