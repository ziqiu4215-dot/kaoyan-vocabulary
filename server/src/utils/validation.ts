import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/** Middleware: return 400 if validation errors exist */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(e => e.msg).join('; ');
    res.status(400).json({ success: false, message: msg });
    return;
  }
  next();
}

// ─── Shared rules ───

const usernameRule = body('username')
  .trim()
  .isLength({ min: 2, max: 20 }).withMessage('用户名 2-20 个字符')
  .matches(/^[\w一-龥-]+$/).withMessage('用户名只能包含字母、数字、中文、下划线和连字符');

const emailRule = body('email')
  .trim()
  .isEmail().withMessage('邮箱格式不正确')
  .normalizeEmail();

const passwordRule = body('password')
  .isLength({ min: 6, max: 128 }).withMessage('密码 6-128 位');

const phoneRule = body('phone')
  .trim()
  .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确');

const codeRule = body('code')
  .trim()
  .isLength({ min: 4, max: 6 }).withMessage('验证码格式不正确');

// ─── Route-specific rule sets ───

export const registerRules = [usernameRule, emailRule, passwordRule, validate];
export const loginRules = [
  body('username').trim().notEmpty().withMessage('请输入用户名或邮箱'),
  body('password').notEmpty().withMessage('请输入密码'),
  validate,
];
export const sendSmsRules = [phoneRule, validate];
export const loginByPhoneRules = [phoneRule, codeRule, validate];
export const bindPhoneRules = [phoneRule, codeRule, validate];
