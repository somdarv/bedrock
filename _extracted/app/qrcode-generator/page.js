'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
export default function page() {
    const [text, setText] = useState('Hello World!');
    const [size, setSize] = useState(200);
    const [darkColor, setDarkColor] = useState('#000000');
    const [lightColor, setLightColor] = useState('#FFFFFF');
    const [errorLevel, setErrorLevel] = useState('H');
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const generateQR = () => {
        if (window.QRCode && isScriptLoaded) {
            const container = document.getElementById('qrcode');
            container.innerHTML = '';

            new window.QRCode(container, {
                text: text,
                width: size,
                height: size,
                colorDark: darkColor,
                colorLight: lightColor,
                correctLevel: window.QRCode.CorrectLevel[errorLevel]
            });
        }
    };

    useEffect(() => {
        if (isScriptLoaded) {
            generateQR();
        }
    }, [text, size, darkColor, lightColor, errorLevel, isScriptLoaded]);

    const handleDownload = () => {
        const canvas = document.querySelector('#qrcode canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
                onLoad={() => setIsScriptLoaded(true)}
            />

            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>QR Code Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Text Input */}
                    <div className="space-y-2">
                        <Label>Text or URL</Label>
                        <Input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text or URL"
                            className="w-full"
                        />
                    </div>

                    {/* Size Slider */}
                    <div className="space-y-2">
                        <Label>Size: {size}x{size}px</Label>
                        <Slider
                            value={[size]}
                            onValueChange={(value) => setSize(value[0])}
                            min={100}
                            max={400}
                            step={10}
                        />
                    </div>

                    {/* Color Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Dark Color</Label>
                            <Input
                                type="color"
                                value={darkColor}
                                onChange={(e) => setDarkColor(e.target.value)}
                                className="h-10 w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Light Color</Label>
                            <Input
                                type="color"
                                value={lightColor}
                                onChange={(e) => setLightColor(e.target.value)}
                                className="h-10 w-full"
                            />
                        </div>
                    </div>

                    {/* Error Correction Level */}
                    <div className="space-y-2">
                        <Label>Error Correction Level</Label>
                        <Select value={errorLevel} onValueChange={setErrorLevel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="L">Low (7%)</SelectItem>
                                <SelectItem value="M">Medium (15%)</SelectItem>
                                <SelectItem value="Q">Quartile (25%)</SelectItem>
                                <SelectItem value="H">High (30%)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* QR Code Display */}
                    <div
                        id="qrcode"
                        className="flex justify-center bg-white p-4 rounded-lg"
                    />

                    {/* Download Button */}
                    <Button
                        onClick={handleDownload}
                        className="w-full"
                    >
                        Download QR Code
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}