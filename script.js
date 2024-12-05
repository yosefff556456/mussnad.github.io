// رابط CSV من Google Sheets (استبدل هذا بالرابط الخاص بك)
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6PofkmS3WNppu0IPU7aYpSFhIOcXuxoa8d2TK9KEo5DfiYQaH9BNeUJHfNJ-V0gy0HpRlVBGn12H5/pub?output=csv';

// إنشاء الخريطة
const map = L.map('map').setView([30, 0], 2);

// خيارات طبقات الخريطة
const baseMaps = {
    "خريطة الشوارع": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; مساهمة OpenStreetMap'
    }).addTo(map),
    "القمر الصناعي": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        subdomains:['mt0','mt1','mt2','mt3'],
        attribution: '&copy; Google Maps'
    })
};

// إضافة التحكم في الطبقات
L.control.layers(baseMaps).addTo(map);

// أيقونات مخصصة بناءً على المجموعة الوراثية
const icons = {};

// وظيفة للحصول على أيقونة بناءً على المجموعة الوراثية
function getIcon(yGroup) {
    if (!icons[yGroup]) {
        icons[yGroup] = L.icon({
            iconUrl: `icons/${yGroup}.png`, // يجب أن يكون لديك مجلد 'icons' يحتوي على الأيقونات
            iconSize: [32, 37],
            iconAnchor: [16, 37],
            popupAnchor: [0, -37]
        });
    }
    return icons[yGroup];
}

// مجموعة لتجميع العلامات
const markers = L.markerClusterGroup();

// تخزين العلامات للبحث
const allMarkers = [];

// جلب البيانات من CSV
Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function(results) {
        const data = results.data;
        data.forEach((item) => {
            const lat = parseFloat(item.Latitude.replace(',', '.'));
            const lon = parseFloat(item.Longitude.replace(',', '.'));
            if (isNaN(lat) || isNaN(lon)) return; // تجاهل البيانات بدون إحداثيات صحيحة

            const yFull = item.y || 'غير متوفر';
            const yGroup = yFull.split('>').pop(); // الحصول على آخر مجموعة وراثية

            const marker = L.marker([lat, lon], { icon: getIcon(yGroup) });

            // محتوى النافذة المنبثقة
            const popupContent = `
                <div class="popup-content">
                    <b>معرف العينة:</b> ${item['o']}<br>
                    <b>الجنس:</b> ${item.Sex || 'غير معروف'}<br>
                    <b>المجموعة الوراثية Y-DNA:</b> ${yFull}<br>
                    <!-- يمكنك إضافة المزيد من المعلومات هنا -->
                </div>
            `;

            marker.bindPopup(popupContent);

            markers.addLayer(marker);
            allMarkers.push({ marker, sampleId: item['o'] });
        });

        map.addLayer(markers);
    }
});

// وظيفة البحث
document.getElementById('search-input').addEventListener('keyup', function(e) {
    const query = e.target.value.toLowerCase();
    markers.clearLayers();
    allMarkers.forEach(({ marker, sampleId }) => {
        if (sampleId && sampleId.toLowerCase().includes(query)) {
            markers.addLayer(marker);
        }
    });
});

