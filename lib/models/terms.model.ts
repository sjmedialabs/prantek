import { BaseModel } from "./base.model"
import type { Term } from "./types"
import { COLLECTIONS } from "../db-config"

export const TermsModel = new BaseModel<Term>(COLLECTIONS.TERMS)
