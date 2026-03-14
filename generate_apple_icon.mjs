import sharp from 'sharp';
import path from 'path';

async function generateIcon() {
    const input = path.join(process.cwd(), 'public', 'favicon.png');
    const output = path.join(process.cwd(), 'public', 'apple-touch-icon.png');

    try {
        // Generate a solid background (180x180 for Apple Touch Icon)
        const bg = sharp({
            create: {
                width: 180,
                height: 180,
                channels: 4,
                background: '#0f172a'
            }
        });

        // Resize the favicon to fit inside (e.g., 140x140) to leave some padding
        const resizedLogo = await sharp(input)
            .resize(140, 140, { 
                fit: 'contain', 
                background: { r: 15, g: 23, b: 42, alpha: 0 } 
            })
            .toBuffer();

        // Composite logo over background
        await bg.composite([
            { input: resizedLogo, gravity: 'center' }
        ])
            .png()
            .toFile(output);

        console.log('Successfully generated apple-touch-icon.png (180x180) with solid background');
    } catch (error) {
        console.error('Error generating icon:', error);
    }
}

generateIcon();

