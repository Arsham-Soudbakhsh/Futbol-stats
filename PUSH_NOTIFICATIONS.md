# Push Notifications (FCM) — Setup

این پروژه از Firebase Cloud Messaging برای پوش‌نوتیفیکیشن استفاده می‌کنه. وقتی
فعال بشه، نوتیف حتی موقعی که اپ کاملاً بسته‌ست (مثل اینستاگرام/تلگرام) به
گوشی کاربر می‌رسه.

## معماری

```
User action (admin/captain) ──► Firestore: notifications/{id}
                                         │
                                         ▼
                         Cloud Function: fanoutNotification
                                         │
                                         ▼
                            FCM ──► users' devices (push)
```

تمام جاهایی که از قبل `createNotification` / `createNotificationsBatch` صدا
زده میشه (admin broadcast، rating_received، rating_visible) خودبه‌خود از
این مسیر استفاده می‌کنن — به کد فعلی دست نزدیم.

## ۱) VAPID key

1. برو به Firebase Console → Project Settings → **Cloud Messaging**
2. تو بخش "Web Push certificates" یه Key pair generate کن
3. مقدارش رو بذار تو `.env` به‌عنوان `VITE_FIREBASE_VAPID_KEY=...`
4. اپ رو دوباره `bun run build` / deploy کن

بدون این کلید، توکن FCM ساخته نمیشه و فقط نوتیف‌های in-tab کار می‌کنن.

## ۲) Deploy Cloud Function

نیاز به Blaze plan داره (مصرف Functions خیلی پایین‌تر از free quota معمولاً
میمونه ولی Firebase الزام Blaze گذاشته).

```bash
cd functions
npm install
firebase login          # یک‌بار
firebase deploy --only functions
```

پروژه پیش‌فرض تو `.firebaserc` ست شده: `footballstats-44792`.

## ۳) Firestore rules (مهم)

به این کالکشن جدید نیاز داری:

```
match /fcm_tokens/{token} {
  // هر کاربر signed-in می‌تونه توکن خودش رو ذخیره/پاک کنه
  allow read, write: if request.auth != null
    && request.resource.data.user_id == request.auth.uid;
  allow delete: if request.auth != null
    && resource.data.user_id == request.auth.uid;
}
```

## چطور تست کنم؟

1. روی موبایل اپ رو باز کن، اجازه‌ی notification بده.
2. توی Firestore Console، کالکشن `fcm_tokens` رو ببین — باید یه doc جدید با
   `user_id` خودت ساخته شده باشه.
3. از پنل ادمین یه broadcast بفرست. حتی اگه اپ رو ببندی، نوتیف رو می‌گیری.

## محدودیت iOS

iOS Safari فقط وقتی پوش می‌گیره که کاربر اپ رو از Safari **"Add to Home
Screen"** کرده باشه (PWA install). تو iOS < 16.4 اصلاً پشتیبانی نمیشه.
