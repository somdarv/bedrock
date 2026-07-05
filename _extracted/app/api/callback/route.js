// api/callback/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, phone } = body;

        console.log('Creating transporter configuration...');
        const transportConfig = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: 465,
            secure: true,
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            debug: true,  // Enable debug logging
            logger: true  // Enable built-in logger
        };

        console.log('Transport config (sanitized):', {
            ...transportConfig,
            auth: {
                user: transportConfig.auth.user ? '✓ Set' : 'X Not Set',
                pass: transportConfig.auth.pass ? '✓ Set' : 'X Not Set'
            }
        });

        let transporter;
        try {
            transporter = nodemailer.createTransport(transportConfig);
            console.log('Transporter created successfully');
        } catch (error) {
            console.error('Transporter creation error:', {
                message: error.message,
                code: error.code,
                response: error.response
            });
            return NextResponse.json(
                { message: 'Email configuration error: ' + error.message },
                { status: 500 }
            );
        }

        // Test the connection
        try {
            await transporter.verify();
            console.log('Email connection verified successfully');
        } catch (error) {
            console.error('Connection verification failed:', {
                message: error.message,
                code: error.code,
                response: error.response
            });
            return NextResponse.json(
                { message: 'Could not connect to email service: ' + error.message },
                { status: 500 }
            );
        }

        // Send the email
        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO,
                subject: 'New Callback Request',
                html: `
                    <h2>New Callback Request</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><em>Received on: ${new Date().toLocaleString()}</em></p>
                `
            });
            console.log('Email sent successfully:', info.messageId);

            return NextResponse.json(
                { message: 'Request received successfully' },
                { status: 200 }
            );
        } catch (error) {
            console.error('Failed to send email:', {
                message: error.message,
                code: error.code,
                response: error.response
            });
            return NextResponse.json(
                { message: 'Failed to send email: ' + error.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}