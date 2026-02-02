<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .otp-code {
            background-color: #1E40AF;
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
        }
        .expiry-notice {
            background-color: #FEF3C7;
            color: #92400E;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 14px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #6B7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OTP Verification</h1>
            <p>Please use the following code to verify your identity</p>
        </div>

        <div class="otp-code">
            {{ $otp }}
        </div>

        <div class="expiry-notice">
            ⏱️ This code will expire in 5 minutes
        </div>

        <p style="text-align: center; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
        </p>

        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
