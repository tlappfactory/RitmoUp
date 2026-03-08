import sharp from 'sharp';
import path from 'path';

async function generateIcon() {
    const input = path.join(process.cwd(), 'public', 'favicon.png');
    const output = path.join(process.cwd(), 'public', 'apple-touch-icon.png');

    try {
        // Generate a solid background
        const bg = sharp({
            create: {
                width: 192,
                height: 192,
                channels: 4,
                background: '#0f172a'
            }
        });

        // Resize the favicon to fit inside (e.g., 160x160)
        const resizedLogo = await sharp(input)
            .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        // Composite logo over background
        await bg.composite([
            { input: resizedLogo, gravity: 'center' }
        ])
            .png()
            .toFile(output);

        console.log('Successfully generated apple-touch-icon.png with solid background');
    } catch (error) {
        console.error('Error generating icon:', error);
    }
}

generateIcon();
