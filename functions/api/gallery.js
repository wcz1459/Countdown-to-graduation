// functions/api/gallery.js
const images = [
    { src: '/assets/images/photo0.jpg', width: 1952, height: 1280, alt: '我们的毕业照' },
    { src: '/assets/images/Photo1.jpg', width: 1706, height: 1280, alt: '长卷' },
    { src: '/assets/images/Photo2.jpg', width: 1707, height: 1280, alt: '某张小照' },
    { src: '/assets/images/Photo3.jpg', width: 1706, height: 1279, alt: '聚会1' },
    { src: '/assets/images/Photo4.jpg', width: 1706, height: 1279, alt: '画廊' },
    { src: '/assets/images/Photo5.jpg', width: 1706, height: 1279, alt: '合唱' },
    { src: '/assets/images/Photo0476.jpg', width: 1706, height: 1280, alt: '合唱前' },
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