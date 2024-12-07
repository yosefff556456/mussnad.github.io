import os
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    message = "تم الوصول إلى الصفحة الرئيسية"
    print(message)  # لا يزال الطباعة لوحدة التحكم
    return render_template('index.html', message=message)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    startup_message = f"تشغيل التطبيق على المنفذ {port}"
    print(startup_message)
    app.run(debug=True, host='0.0.0.0', port=port)
