// رابط CSV من Google Sheets
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6PofkmS3WNppu0IPU7aYpSFhIOcXuxoa8d2TK9KEo5DfiYQaH9BNeUJHfNJ-V0gy0HpRlVBGn12H5/pub?output=csv';

// إنشاء الخريطة
const map = L.map('map').setView([30, 0], 2);

// إضافة طبقة الخريطة
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; مساهمة OpenStreetMap'
}).addTo(map);

// أيقونة الجمجمة
const skullIcon = L.icon({
    iconUrl: 'skull_icon.png', // تأكد من وجود ملف أيقونة الجمجمة
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// تخزين المواقع
const locations = {};

// جلب البيانات من CSV
Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function(results) {
        const data = results.data;
        data.forEach((item) => {
            const lat = parseFloat(item.Latitude);
            const lon = parseFloat(item.Longitude);
            if (isNaN(lat) || isNaN(lon)) return; // تجاهل البيانات بدون إحداثيات صحيحة

            const key = `${lat},${lon}`;

            if (!locations[key]) {
                locations[key] = [];
            }

            locations[key].push(item);
        });

        // إضافة العلامات إلى الخريطة
        for (const key in locations) {
            const samples = locations[key];
            const [lat, lon] = key.split(',').map(Number);

            const marker = L.marker([lat, lon], { icon: skullIcon }).addTo(map);

            // إنشاء محتوى النافذة المنبثقة
            let currentIndex = 0;

            const popupContent = document.createElement('div');
            popupContent.className = 'popup-content';

            const contentDiv = document.createElement('div');
            popupContent.appendChild(contentDiv);

            const navDiv = document.createElement('div');
            navDiv.className = 'nav-buttons';

            const prevButton = document.createElement('button');
            prevButton.textContent = 'السابق';
            prevButton.onclick = () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateContent();
                }
            };
            navDiv.appendChild(prevButton);

            const counter = document.createElement('span');
            navDiv.appendChild(counter);

            const nextButton = document.createElement('button');
            nextButton.textContent = 'التالي';
            nextButton.onclick = () => {
                if (currentIndex < samples.length - 1) {
                    currentIndex++;
                    updateContent();
                }
            };
            navDiv.appendChild(nextButton);

            popupContent.appendChild(navDiv);

            function updateContent() {
                const sample = samples[currentIndex];
                contentDiv.innerHTML = `
                    <b>معرف الكائن:</b> ${sample['Object-ID']}<br>
                    <b>الجنس:</b> ${sample.Sex || 'غير معروف'}<br>
                    <b>العمر:</b> ${sample.Age || 'غير متوفر'}<br>
                    <b>الثقافة:</b> ${sample['Simplified_Culture'] || 'غير متوفر'}<br>
                    <b>الموقع:</b> ${sample.Location || 'غير متوفر'}<br>
                    <b>الدولة:</b> ${sample.Country || 'غير متوفر'}<br>
                    <!-- أضف المزيد من البيانات المهمة هنا -->
                `;
                counter.textContent = ` (${currentIndex + 1}/${samples.length}) `;
            }

            updateContent();

            marker.bindPopup(popupContent);
        }
    }
});
