import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

/** Valida body/params/query com um schema Zod e responde 400 com o motivo
 * exato do campo que falhou — nunca deixa dado não validado chegar na rota. */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos.', issues: result.error.issues })
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return res.status(400).json({ error: 'Parâmetros inválidos.', issues: result.error.issues })
    }
    // Express 5 expõe req.query como getter-only — não dá pra reatribuir
    // diretamente, então sobrescrevemos a propriedade em si.
    Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true })
    next()
  }
}
