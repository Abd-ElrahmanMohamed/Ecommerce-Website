# 🧪 اختبار سريع - Default Address

## ⚡ الخطوات السريعة (5 دقائق)

### 1️⃣ التحضير

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
npm start
```

### 2️⃣ تسجيل الدخول

```
http://localhost:4200/login
Email: test@example.com
Password: password123
```

### 3️⃣ فتح Addresses Tab

```
http://localhost:4200/account
انقر "Addresses" tab
```

### 4️⃣ أضف عنوانين

```
انقر "Add New Address" مرتين
ملء النماذج بـ بيانات مختلفة
```

### 5️⃣ اختبر "Set as Default"

```
انقر "Set as Default" على أول عنوان
Expected:
  ✅ يظهر "Default" badge
  ✅ الزر يختفي
  ✅ الرسالة "Default address updated successfully!"
```

### 6️⃣ اختبر التبديل

```
انقر "Set as Default" على عنوان ثاني
Expected:
  ✅ الأول فقد badge
  ✅ الثاني أصبح default
  ✅ واحد فقط هو default
```

### 7️⃣ اختبر التوازن

```
F5 (تحديث الصفحة)
Expected:
  ✅ نفس العنوان بقي default
  ✅ البيانات من Database صحيحة
```

---

## 📊 ما تتوقعه

### المرة الأولى:

```
Address 1: 123 Main St (No badge) → Set as Default button
Address 2: 456 Side St (No badge) → Set as Default button
```

### بعد النقر على الأول:

```
Address 1: 123 Main St [Default] (No button - badge instead)
Address 2: 456 Side St (No badge) → Set as Default button
```

### بعد النقر على الثاني:

```
Address 1: 123 Main St (No badge) → Set as Default button
Address 2: 456 Side St [Default] (No button - badge instead)
```

---

## ✅ قائمة التحقق

- [ ] يمكن إضافة عنوانين
- [ ] زر "Set as Default" يظهر
- [ ] النقر على الزر ينجح
- [ ] رسالة النجاح تظهر
- [ ] Badge [Default] يظهر
- [ ] زر يختفي
- [ ] عنوان واحد فقط هو default
- [ ] بعد التحديث، البيانات محفوظة

---

## 🔍 في Console

```javascript
// بدون أخطاء حمراء
// يجب أن تظهر رسالة النجاح
// Network: PUT 200 OK
```

---

## ✨ النتيجة

**نجاح:** ✅ يمكنك تعيين وحفظ العنوان الافتراضي

---

**الاختبار السريع جاهز!** 🎉
