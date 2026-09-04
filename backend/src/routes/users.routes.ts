import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { createUser, deleteUser, listUsers, updateUser } from "../controllers/users.controller";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));
router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);
export default router;
