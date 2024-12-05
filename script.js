// رابط CSV من Google Sheets
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6PofkmS3WNppu0IPU7aYpSFhIOcXuxoa8d2TK9KEo5DfiYQaH9BNeUJHfNJ-V0gy0HpRlVBGn12H5/pub?output=csv';

// إنشاء الخريطة
let map;
let markers = [];
let markerCluster;

// تخزين البيانات المجموعة حسب الإحداثيات
const samplesData = {};

// تخزين جميع العينات للبحث
let allSamples = [];

// تهيئة الخريطة
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30, lng: 0 },
        zoom: 2,
        mapTypeId: 'roadmap'
    });

    // إعداد MarkerClusterer
    markerCluster = new MarkerClusterer(map, [], {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });

    // جلب البيانات من CSV
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            processData(data);
            createMarkers();
            setupSearch();
        }
    });
}

// معالجة البيانات
function processData(data) {
    data.forEach(item => {
        // استبدال الفاصلة بالعقدة العشرية
        const lat = parseFloat(item.Latitude.replace('٫', '.'));
        const lng = parseFloat(item.Longitude.replace('٫', '.'));
        const sampleName = item['o'];
        const sex = item['Sex'];
        const yGroup = item['y'];

        if (isNaN(lat) || isNaN(lng)) return; // تجاهل البيانات بدون إحداثيات صحيحة

        const key = `${lat},${lng}`;

        if (!samplesData[key]) {
            samplesData[key] = [];
        }

        samplesData[key].push({
            name: sampleName,
            sex: sex,
            y: yGroup
        });

        // تخزين جميع العينات للبحث
        allSamples.push({
            name: sampleName,
            lat: lat,
            lng: lng,
            markerIndex: key
        });
    });
}

// إنشاء العلامات
function createMarkers() {
    for (const key in samplesData) {
        const [lat, lng] = key.split(',').map(Number);
        const samples = samplesData[key];

        // تحديد الأيقونة بناءً على المجموعة الوراثية الأخيرة
        const lastYGroup = samples[samples.length - 1].y.split('>').pop();
        const iconUrl = `icons/${lastYGroup}.png`; // تأكد من وجود الأيقونات في مجلد 'icons'

        const marker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            icon: {
                url: iconUrl,
                scaledSize: new google.maps.Size(32, 37) // تعديل حجم الأيقونة حسب الحاجة
            }
        });

        // إنشاء محتوى النافذة المنبثقة
        let currentIndex = 0;
        const totalSamples = samples.length;

        const infoWindow = new google.maps.InfoWindow({
            content: generatePopupContent(samples, currentIndex, totalSamples)
        });

        marker.addListener('click', () => {
            infoWindow.setContent(generatePopupContent(samples, currentIndex, totalSamples));
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        markerCluster.addMarker(marker);
    }
}

// توليد محتوى النافذة المنبثقة
function generatePopupContent(samples, currentIndex, totalSamples) {
    const sample = samples[currentIndex];
    let content = `
        <div class="popup-content">
            <h5>${sample.name}</h5>
            <p><strong>الجنس:</strong> ${sample.sex || 'غير معروف'}</p>
            <p><strong>المجموعة الوراثية Y-DNA:</strong> ${sample.y || 'غير متوفر'}</p>
    `;

    if (totalSamples > 1) {
        content += `
            <div class="nav-buttons">
                <button class="btn btn-sm btn-primary prev-button">السابق</button>
                <span>${currentIndex + 1}/${totalSamples}</span>
                <button class="btn btn-sm btn-primary next-button">التالي</button>
            </div>
        `;
    }

    content += `</div>`;

    // إضافة أحداث الأزرار بعد توليد المحتوى
    setTimeout(() => {
        const prevBtn = document.querySelector('.prev-button');
        const nextBtn = document.querySelector('.next-button');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + totalSamples) % totalSamples;
                const newContent = generatePopupContent(samples, currentIndex, totalSamples);
                infoWindow.setContent(newContent);
            });

            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % totalSamples;
                const newContent = generatePopupContent(samples, currentIndex, totalSamples);
                infoWindow.setContent(newContent);
            });
        }
    }, 100);

    return content;
}

// إعداد وظيفة البحث
function setupSearch() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        markerCluster.clearMarkers();

        if (query === '') {
            markers.forEach(marker => markerCluster.addMarker(marker));
            return;
        }

        const filteredMarkers = allSamples.filter(sample => sample.name.toLowerCase().includes(query));

        filteredMarkers.forEach(sample => {
            const key = `${sample.lat},${sample.lng}`;
            const marker = markers.find(m => m.getPosition().lat() === sample.lat && m.getPosition().lng() === sample.lng);
            if (marker) {
                markerCluster.addMarker(marker);
            }
        });
    });
}

// تهيئة الخريطة عند تحميل الصفحة
window.onload = initMap;
