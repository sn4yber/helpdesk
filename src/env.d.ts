/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    agente: {
      id: string;
      nombre: string;
      email: string;
    } | null;
  }
}
