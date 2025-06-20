// functions/api/gallery.js
const images = [
    { src: '/assets/images/photo1.jpg', width: 1952, height: 1280, alt: '我们的毕业照' },
    // 在这里添加更多图片信息...
];

export async function onRequest(context) {
    return new Response(JSON.stringify(images), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 's-maxage=3600'
        },
    });
}