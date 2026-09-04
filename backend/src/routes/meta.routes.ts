import { Router } from "express";
import { listProvinces, listLevels, listSchoolYears } from "../controllers/meta.controller";

const router = Router();

router.get("/provinces", listProvinces);
router.get("/levels", listLevels);
router.get("/school-years", listSchoolYears);

export default router;
