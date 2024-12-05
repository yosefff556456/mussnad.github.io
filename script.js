// رابط CSV من Google Sheets (استبدل هذا بالرابط الخاص بك)

// رابط CSV من Google Sheets (استبدله برابطك)
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6PofkmS3WNppu0IPU7aYpSFhIOcXuxoa8d2TK9KEo5DfiYQaH9BNeUJHfNJ-V0gy0HpRlVBGn12H5/pub?output=csv';

// إنشاء الخريطة
const map = L.map('map').setView([30, 0], 2);

// خيارات طبقات الخريطة
const baseMaps = {
    "خريطة الشوارع": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; مساهمة OpenStreetMap'
    }).addTo(map),
    "القمر الصناعي": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap'
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
            iconUrl: `icons/${yGroup}.png`, // تأكد من وجود الأيقونات في مجلد 'icons'
            iconSize: [32, 37],
            iconAnchor: [16, 37],
            popupAnchor: [0, -37]
        });
    }
    return icons[yGroup];
}

// مجموعة لتجميع العلامات
const markers = L.markerClusterGroup();

// تخزين العلامات والبيانات للبحث
const allMarkers = [];
const samplesData = [];

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

            const key = `${lat},${lon}`;
            item.lat = lat;
            item.lon = lon;

            if (!samplesData[key]) {
                samplesData[key] = [];
            }
            samplesData[key].push(item);

            const marker = L.marker([lat, lon], { icon: getIcon(yGroup) });

            // محتوى النافذة المنبثقة
            let currentIndex = 0;
            const totalSamples = samplesData[key].length;

            const popupContent = document.createElement('div');
            popupContent.className = 'popup-content';

            const contentDiv = document.createElement('div');
            popupContent.appendChild(contentDiv);

            if (totalSamples > 1) {
                const navDiv = document.createElement('div');
                navDiv.className = 'nav-buttons text-center mt-2';

                const prevButton = document.createElement('button');
                prevButton.textContent = 'السابق';
                prevButton.className = 'btn btn-sm btn-primary mx-1';
                prevButton.onclick = () => {
                    currentIndex = (currentIndex - 1 + totalSamples) % totalSamples;
                    updateContent();
                };
                navDiv.appendChild(prevButton);

                const counter = document.createElement('span');
                navDiv.appendChild(counter);

                const nextButton = document.createElement('button');
                nextButton.textContent = 'التالي';
                nextButton.className = 'btn btn-sm btn-primary mx-1';
                nextButton.onclick = () => {
                    currentIndex = (currentIndex + 1) % totalSamples;
                    updateContent();
                };
                navDiv.appendChild(nextButton);

                popupContent.appendChild(navDiv);
            }

            function updateContent() {
                const sample = samplesData[key][currentIndex];
                contentDiv.innerHTML = `
                    <b>معرف العينة:</b> ${sample['o']}<br>
                    <b>الجنس:</b> ${sample.Sex || 'غير معروف'}<br>
                    <b>المجموعة الوراثية Y-DNA:</b> ${sample.y || 'غير متوفر'}<br>
                `;
                if (totalSamples > 1) {
                    counter.textContent = ` (${currentIndex + 1}/${totalSamples}) `;
                }
            }

            updateContent();

            marker.bindPopup(popupContent);

            markers.addLayer(marker);
            allMarkers.push({ marker, sampleId: item['o'], yGroup });
        });

        map.addLayer(markers);
    }
});

// وظيفة البحث المحسّنة
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    searchResults.innerHTML = '';

    if (query.length === 0) {
        markers.eachLayer(marker => {
            markers.addLayer(marker);
        });
        return;
    }

    allMarkers.forEach(({ marker, sampleId }) => {
        if (sampleId && sampleId.toLowerCase().includes(query)) {
            const listItem = document.createElement('a');
            listItem.className = 'list-group-item list-group-item-action';
            listItem.href = '#';
            listItem.textContent = sampleId;
            listItem.onclick = () => {
                map.setView(marker.getLatLng(), 8);
                marker.openPopup();
                searchResults.innerHTML = '';
                searchInput.value = '';
            };
            searchResults.appendChild(listItem);
        }
    });
});
