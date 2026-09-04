# قائمة API Endpoints (مخطط شامل للمشروع)

الأساس: `/api/v1`

## المصادقة (منجز في المرحلة 1)
- `POST /auth/register/teacher` — إنشاء حساب أستاذ (رقم التأجير = اسم المستخدم)
- `POST /auth/register/student` — إنشاء حساب تلميذ (رمز مسار = اسم المستخدم)
- `POST /auth/login` — تسجيل الدخول (يحدد الدور تلقائيًا)
- `POST /auth/refresh` — تجديد التوكن
- `GET /auth/me` — بيانات المستخدم الحالي

## البيانات المرجعية (منجز في المرحلة 1)
- `GET /meta/provinces`
- `GET /meta/levels` (مع الشعب والمواد المرتبطة)
- `GET /meta/school-years`

## الحصص والجدولة (منجز في المرحلة 2)
- `POST /sessions` — اقتراح حصة (يتحقق من التاريخ والتعارض)
- `POST /sessions/check-conflict` — تحقق مسبق من التعارض دون إنشاء الحصة
- `GET /sessions` — لائحة الحصص (فلاتر: مستوى/شعبة/مادة/أستاذ/تاريخ/حالة، معزولة حسب المديرية للمنسق)
- `GET /sessions/mine` — حصص الأستاذ الحالي أو دروس التلميذ الحالي
- `PATCH /sessions/:id/status` — تغيير الحالة (منسق/رئيس مصلحة/مسؤول)
- `PATCH /sessions/:id/meeting-link` — تعديل رابط اللقاء (الأستاذ صاحب الحصة)
- `GET /schedule/weekly` — استعمال الزمن الأسبوعي (فلاتر + تنقل بين الأسابيع)

## التسجيل (منجز في المرحلة 3)
- `POST /sessions/:id/enroll` — تسجيل تلميذ في حصة (يمنع التكرار عبر قيد فريد في القاعدة)
- `GET /sessions/:id/students` — لائحة مستفيدي حصة معينة (الأستاذ صاحب الحصة)
- `GET /beneficiaries/mine` — كل التلاميذ المستفيدين عبر حصص الأستاذ الحالي
- `GET /lessons/available` — الدروس المتاحة للتلميذ حسب مستواه/شعبته (مع إشارة isEnrolled)

## الساعات والشهادات (المرحلة 5)
- `GET /teachers/:id/hours`
- `GET /teachers/:id/certificates`
- `GET /certificates/eligible` — لائحة الأساتذة المستحقين

## لوحات القيادة (المرحلة 6)
- `GET /dashboard/teacher`
- `GET /dashboard/province/:provinceId`
- `GET /dashboard/regional`

## التقارير والتصدير (المرحلة 7)
- `GET /reports/weekly-schedule.pdf`
- `GET /export/teachers.xlsx`
- `GET /export/students.xlsx`
- `GET /export/sessions.xlsx`
- `POST /import/teachers` (Excel/CSV)

## الإعدادات (المرحلة 8)
- `GET /settings` / `PUT /settings` (شعار، اسم الأكاديمية، السنة النشطة، مزود البريد)
- `GET /notifications` / `PATCH /notifications/:id/read`

## الساعات والشهادات (منجز في المرحلة 5)
- `GET /hours/mine` — ملخص ساعات وشهادات الأستاذ الحالي
- `GET /hours/eligible-teachers` — لائحة الأساتذة المستحقين لشهادة (منسق/رئيس مصلحة/مسؤول)

## لوحات القيادة (منجز في المرحلة 6)
- `GET /dashboard/teacher`
- `GET /dashboard/province` (معزولة تلقائيًا للمنسق، أو عبر `?provinceId=` لرئيس المصلحة/المسؤول)
- `GET /dashboard/regional`

## التقارير والتصدير (منجز في المرحلة 7)
- `GET /export/beneficiaries.xlsx` (الأستاذ)
- `GET /export/teachers.xlsx` (منسق/رئيس مصلحة/مسؤول)
- `GET /export/sessions.xlsx` (منسق/رئيس مصلحة/مسؤول)
- `GET /export/weekly-schedule.pdf` (منسق/رئيس مصلحة/مسؤول)

## الدلائل (منجز في المرحلة 6)
- `GET /directory/teachers` — لائحة الأساتذة (معزولة حسب المديرية)
- `GET /directory/students` — لائحة التلاميذ (معزولة حسب المديرية)

## الإعدادات والإشعارات (منجز في المرحلة 8)
- `GET /settings` / `PUT /settings` (التعديل للمسؤول فقط)
- `POST /settings/school-years` — إنشاء سنة دراسية جديدة (المسؤول)
- `GET /notifications/mine`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
