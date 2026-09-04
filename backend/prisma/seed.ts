import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PROVINCES = [
  "مراكش",
  "آسفي",
  "الصويرة",
  "قلعة السراغنة",
  "اليوسفية",
  "شيشاوة",
  "الرحامنة",
  "الحوز",
];

const SUBJECT_NAMES = [
  "الرياضيات",
  "اللغة العربية",
  "اللغة الفرنسية",
  "التربية الإسلامية",
  "الفيزياء والكيمياء",
  "الاجتماعيات",
  "علوم الحياة والأرض",
  "اللغة الإنجليزية",
  "الفلسفة",
  "علوم المهندس",
];

async function main() {
  console.log("🌱  بدء زرع البيانات...");

  // 1) المديريات
  for (const name of PROVINCES) {
    await prisma.province.upsert({ where: { name }, update: {}, create: { name } });
  }
  await prisma.province.upsert({
    where: { name: "أخرى" },
    update: {},
    create: { name: "أخرى", isOther: true },
  });

  // 2) المواد
  const subjects: Record<string, string> = {};
  for (const name of SUBJECT_NAMES) {
    const s = await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
    subjects[name] = s.id;
  }

  // 3) المستويات والشعب والمواد المرتبطة
  const levelDefs = [
    {
      name: "السادس ابتدائي",
      order: 1,
      hasStreams: false,
      streams: [] as string[],
      subjectList: ["الرياضيات", "اللغة العربية", "اللغة الفرنسية", "التربية الإسلامية"],
    },
    {
      name: "الثالثة إعدادي",
      order: 2,
      hasStreams: false,
      streams: [] as string[],
      subjectList: [
        "الرياضيات",
        "الفيزياء والكيمياء",
        "اللغة الفرنسية",
        "اللغة العربية",
        "الاجتماعيات",
        "علوم الحياة والأرض",
        "التربية الإسلامية",
      ],
    },
    {
      name: "الأولى بكالوريا",
      order: 3,
      hasStreams: true,
      streams: [
        "العلوم التجريبية",
        "العلوم الرياضية",
        "الآداب والعلوم الإنسانية",
        "العلوم الاقتصادية والتدبير",
      ],
      subjectList: [
        "الرياضيات",
        "الفيزياء والكيمياء",
        "اللغة الفرنسية",
        "اللغة العربية",
        "الاجتماعيات",
        "علوم الحياة والأرض",
        "التربية الإسلامية",
        "اللغة الإنجليزية",
        "الفلسفة",
        "علوم المهندس",
      ],
    },
    {
      name: "الثانية بكالوريا",
      order: 4,
      hasStreams: true,
      streams: [
        "العلوم الفيزيائية",
        "العلوم الرياضية",
        "الآداب والعلوم الإنسانية",
        "العلوم الاقتصادية والتدبير",
      ],
      subjectList: [
        "الرياضيات",
        "الفيزياء والكيمياء",
        "اللغة الفرنسية",
        "اللغة العربية",
        "الاجتماعيات",
        "علوم الحياة والأرض",
        "التربية الإسلامية",
        "اللغة الإنجليزية",
        "الفلسفة",
        "علوم المهندس",
      ],
    },
  ];

  const levelIds: Record<string, string> = {};

  for (const def of levelDefs) {
    const level = await prisma.level.upsert({
      where: { name: def.name },
      update: { order: def.order, hasStreams: def.hasStreams },
      create: { name: def.name, order: def.order, hasStreams: def.hasStreams },
    });
    levelIds[def.name] = level.id;

    for (const streamName of def.streams) {
      await prisma.stream.upsert({
        where: { name_levelId: { name: streamName, levelId: level.id } },
        update: {},
        create: { name: streamName, levelId: level.id },
      });
    }

    for (const subjectName of def.subjectList) {
      await prisma.levelSubject.upsert({
        where: { levelId_subjectId: { levelId: level.id, subjectId: subjects[subjectName] } },
        update: {},
        create: { levelId: level.id, subjectId: subjects[subjectName] },
      });
    }
  }

  // 4) السنة الدراسية النشطة
  const schoolYear = await prisma.schoolYear.upsert({
    where: { label: "2026/2027" },
    update: { isActive: true },
    create: { label: "2026/2027", isActive: true },
  });

  // 5) إعدادات النظام
  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: { activeSchoolYearId: schoolYear.id },
    create: {
      id: "singleton",
      activeSchoolYearId: schoolYear.id,
    },
  });

  // 6) حسابات تجريبية
  const marrakech = await prisma.province.findUniqueOrThrow({ where: { name: "مراكش" } });
  const passwordHash = await bcrypt.hash("Passw0rd!", 12);
  // ضع الاسم الحقيقي للمنسق الإقليمي في REGIONAL_COORDINATOR_NAME قبل تشغيل seed.
  const regionalCoordinatorName = process.env.REGIONAL_COORDINATOR_NAME?.trim() || null;

  // ترحيل الحسابات التجريبية القديمة إلى صيغة رقم التأجير الجديدة عند إعادة تشغيل seed.
  const oldChef = await prisma.user.findUnique({ where: { username: "chef.service" } });
  if (oldChef && !(await prisma.user.findUnique({ where: { username: "100001" } }))) {
    await prisma.user.update({ where: { id: oldChef.id }, data: { username: "100001" } });
  }
  const oldCoord = await prisma.user.findUnique({ where: { username: "coord.marrakech" } });
  if (oldCoord && !(await prisma.user.findUnique({ where: { username: "100002" } }))) {
    await prisma.user.update({ where: { id: oldCoord.id }, data: { username: "100002" } });
  }
  const oldTeacher = await prisma.user.findUnique({ where: { username: "T12345" }, include: { teacher: true } });
  if (oldTeacher && !(await prisma.user.findUnique({ where: { username: "100003" } }))) {
    await prisma.user.update({ where: { id: oldTeacher.id }, data: { username: "100003" } });
    if (oldTeacher.teacher) await prisma.teacher.update({ where: { id: oldTeacher.teacher.id }, data: { matricule: "100003" } });
  }

  // مسؤول النظام
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash, role: "ADMIN", email: "admin@aref-ms.ma" },
  });

  // رئيس مصلحة التعلم والتكوين عن بعد
  await prisma.user.upsert({
    where: { username: "100001" },
    update: {},
    create: {
      username: "100001",
      passwordHash,
      role: "REGIONAL_HEAD",
      email: "chef.service@aref-ms.ma",
    },
  });

  // منسق إقليمي (مراكش)
  await prisma.user.upsert({
    where: { username: "100002" },
    update: regionalCoordinatorName ? { fullName: regionalCoordinatorName } : {},
    create: {
      username: "100002",
      passwordHash,
      role: "PROVINCIAL_COORDINATOR",
      email: "coord.marrakech@aref-ms.ma",
      provinceId: marrakech.id,
      fullName: regionalCoordinatorName,
    },
  });

  // أستاذ تجريبي
  const existingTeacherUser = await prisma.user.findUnique({ where: { username: "100003" } });
  if (!existingTeacherUser) {
    await prisma.user.create({
      data: {
        username: "100003",
        passwordHash,
        role: "TEACHER",
        email: "teacher.demo@aref-ms.ma",
        teacher: {
          create: {
            fullName: "محمد العلوي",
            matricule: "100003",
            email: "teacher.demo@aref-ms.ma",
            provinceId: marrakech.id,
            levelId: levelIds["الأولى بكالوريا"],
          },
        },
      },
    });
  }

  // تلميذ تجريبي
  const existingStudentUser = await prisma.user.findUnique({ where: { username: "M2026001" } });
  if (!existingStudentUser) {
    await prisma.user.create({
      data: {
        username: "M2026001",
        passwordHash,
        role: "STUDENT",
        email: "student.demo@aref-ms.ma",
        student: {
          create: {
            fullName: "فاطمة الزهراء بنعلي",
            code: "M2026001",
            email: "student.demo@aref-ms.ma",
            provinceId: marrakech.id,
            levelId: levelIds["الأولى بكالوريا"],
          },
        },
      },
    });
  }

  console.log("✅  تم زرع البيانات بنجاح.");
  console.log("");
  console.log("── حسابات تجريبية (كلمة المرور للجميع: Passw0rd!) ──");
  console.log("  المسؤول:            admin");
  console.log("  رئيس المصلحة:        100001");
  console.log("  المنسق (مراكش):      coord.marrakech");
  console.log("  الأستاذ:             100003");
  console.log("  التلميذ:             M2026001");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
