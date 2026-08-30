"use client";

import { createContext, useContext } from "react";

export type TypeAdmin = "principal" | "gestion_complete" | "mise_a_disposition";

export const AdminContext = createContext<TypeAdmin>("principal");

export function useTypeAdmin() {
  return useContext(AdminContext);
}
