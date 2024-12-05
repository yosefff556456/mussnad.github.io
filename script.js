// رابط CSV من Google Sheets

// رابط CSV من Google Sheets
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6PofkmS3WNppu0IPU7aYpSFhIOcXuxoa8d2TK9KEo5DfiYQaH9BNeUJHfNJ-V0gy0HpRlVBGn12H5/pub?output=csv';

// إنشاء الخريطة
const map = L.map('map').setView([30, 0], 2);

// إضافة طبقة الخريطة الأساسية
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; مساهمة OpenStreetMap'
}).addTo(map);

// تخزين البيانات المجموعة حسب الإحداثيات
const samplesData = {};

// تخزين جميع العينات للبحث
let allSamples = [];

// مجموعة لتجميع العلامات
const markers = L.markerClusterGroup();

// وظيفة للحصول على أيقونة مخصصة
function getIcon(yGroup) {
    const iconUrl = `icons/${yGroup}.png`;
    return L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -37],
        className: 'marker-icon'
    });
}

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

// معالجة البيانات
function processData(data) {
    data.forEach(item => {
        // استبدال الفاصلة بالعقدة العشرية
        const sampleName = item['o'];
        const lat = parseFloat(item.Latitude.replace('٫', '.'));
        const lng = parseFloat(item.Longitude.replace('٫', '.'));
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
            key: key
        });
    });
}

// إنشاء العلامات
function createMarkers() {
    for (const key in samplesData) {
        const [lat, lng] = key.split(',').map(Number);
        const samples = samplesData[key];

        // تحديد الأيقونة بناءً على المجموعة الوراثية الأخيرة
        const lastYGroup = samples[samples.length - 1].y ? samples[samples.length - 1].y.split('>').pop() : 'default';
        const icon = getIcon(lastYGroup);

        const marker = L.marker([lat, lng], { icon: icon });

        // إضافة Tooltip عند تمرير الماوس فوق العلامة
        marker.bindTooltip(`عينة: ${samples[0].name}`, { permanent: false, direction: 'top' });

        // إنشاء محتوى النافذة المنبثقة
        let currentIndex = 0;
        const totalSamples = samples.length;

        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';

        const contentDiv = document.createElement('div');
        popupContent.appendChild(contentDiv);

        if (totalSamples > 1) {
            const navDiv = document.createElement('div');
            navDiv.className = 'nav-buttons';

            const prevButton = document.createElement('button');
            prevButton.textContent = 'السابق';
            prevButton.className = 'btn btn-sm btn-primary';
            prevButton.onclick = () => {
                currentIndex = (currentIndex - 1 + totalSamples) % totalSamples;
                updateContent();
            };
            navDiv.appendChild(prevButton);

            const counter = document.createElement('span');
            navDiv.appendChild(counter);

            const nextButton = document.createElement('button');
            nextButton.textContent = 'التالي';
            nextButton.className = 'btn btn-sm btn-primary';
            nextButton.onclick = () => {
                currentIndex = (currentIndex + 1) % totalSamples;
                updateContent();
            };
            navDiv.appendChild(nextButton);

            popupContent.appendChild(navDiv);
        }

        function updateContent() {
            const sample = samples[currentIndex];
            contentDiv.innerHTML = `
                <h5>${sample.name}</h5>
                <p><strong>الجنس:</strong> ${sample.sex || 'غير معروف'}</p>
                <p><strong>المجموعة الوراثية Y-DNA:</strong> ${sample.y || 'غير متوفر'}</p>
            `;
            if (totalSamples > 1) {
                counter.textContent = ` (${currentIndex + 1}/${totalSamples}) `;
            }
        }

        updateContent();

        marker.bindPopup(popupContent);

        markers.addLayer(marker);
    }

    map.addLayer(markers);
}

// إعداد وظيفة البحث
function setupSearch() {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        markers.clearLayers();

        if (query === '') {
            markers.eachLayer(marker => markers.addLayer(marker));
            return;
        }

        const filteredMarkers = allSamples.filter(sample => sample.name.toLowerCase().includes(query));

        filteredMarkers.forEach(sample => {
            const marker = markers.getLayers().find(m => {
                const latLng = m.getLatLng();
                return latLng.lat === sample.lat && latLng.lng === sample.lng;
            });
            if (marker) {
                markers.addLayer(marker);
            }
        });
    });
}

