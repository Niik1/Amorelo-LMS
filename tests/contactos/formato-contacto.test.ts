import { describe, it, expect } from "vitest";
import {
  normalizarTelefonoE164,
  obtenerMesAno,
  obtenerNombrePrimerApellido,
  construirDisplayNameContacto,
  generarArchivoVCard,
  generarArchivoGoogleContactsCsv,
  type DatosContactoExportar,
} from "@/lib/contactos/formato-contacto";

describe("Formato y Normalización de Contactos", () => {
  describe("normalizarTelefonoE164", () => {
    it("normaliza teléfono peruano de 9 dígitos a +51...", () => {
      expect(normalizarTelefonoE164("987654321", "PE")).toBe("+51987654321");
      expect(normalizarTelefonoE164("987 654 321", "PE")).toBe("+51987654321");
    });

    it("respeta si ya incluye el prefijo +51", () => {
      expect(normalizarTelefonoE164("+51987654321", "PE")).toBe("+51987654321");
    });

    it("normaliza teléfono colombiano con código CO", () => {
      expect(normalizarTelefonoE164("3001234567", "CO")).toBe("+573001234567");
    });

    it("retorna null si el teléfono está vacío o es inválido", () => {
      expect(normalizarTelefonoE164("", "PE")).toBeNull();
      expect(normalizarTelefonoE164("abc", "PE")).toBeNull();
      expect(normalizarTelefonoE164("123", "PE")).toBeNull();
    });
  });

  describe("Display Name de Contacto", () => {
    it("formatea correctamente para un curso virtual con formato 'Nombre Apellido • Nov-2026'", () => {
      const nombre = construirDisplayNameContacto(
        "María",
        "Rojas",
        "2026-11-10T15:00:00Z",
        "curso"
      );
      expect(nombre).toBe("María Rojas • Nov-2026");
    });

    it("formatea correctamente para un taller presencial con formato 'Nombre Apellido • Taller Nov-2026'", () => {
      const nombre = construirDisplayNameContacto(
        "María",
        "Rojas",
        "2026-11-10T15:00:00Z",
        "taller"
      );
      expect(nombre).toBe("María Rojas • Taller Nov-2026");
    });
  });

  describe("generarArchivoVCard", () => {
    it("genera vCard 3.0 con FN, ORG, TITLE, TEL y NOTE", () => {
      const contactos: DatosContactoExportar[] = [
        {
          id: "mat-1",
          nombres: "María del Carmen",
          apellidos: "Rojas Silva",
          telefono: "987654321",
          pais: "PE",
          correo: "maria@test.com",
          documento: "DNI: 78451236",
          cursoOTallerNombre: "Flores Preservadas",
          tipo: "curso",
          fechaRegistroIso: "2026-11-10T12:00:00Z",
        },
      ];

      const vcf = generarArchivoVCard(contactos);
      expect(vcf).toContain("BEGIN:VCARD");
      expect(vcf).toContain("VERSION:3.0");
      expect(vcf).toContain("FN:María Rojas • Nov-2026");
      expect(vcf).toContain("TEL;TYPE=CELL,VOICE:+51987654321");
      expect(vcf).toContain("EMAIL;TYPE=INTERNET:maria@test.com");
      expect(vcf).toContain("ORG:Amorelo - Flores Preservadas");
      expect(vcf).toContain("END:VCARD");
    });
  });
});
