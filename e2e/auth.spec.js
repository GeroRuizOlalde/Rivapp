import { test, expect, expectNoCrash } from './fixtures.js';

/**
 * Interacción de login SIN mutar producción.
 *
 * - "credenciales inválidas" hace un intento de auth fallido (lectura, no crea
 *   ni modifica nada) y verifica el manejo de error de la UI.
 * - El flujo autenticado real está al final, APAGADO por defecto: solo corre si
 *   definís E2E_EMAIL y E2E_PASSWORD (idealmente contra un entorno de prueba,
 *   NO contra la base de producción).
 */

test.describe('Login — manejo de error', () => {
  test('credenciales inválidas no navegan y muestran feedback', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('no-existe@rivapp-e2e.test');
    await page.getByLabel('Contraseña').fill('contraseña-invalida-123');
    await page.getByRole('button', { name: /Ingresar/i }).click();

    // Un login fallido nunca navega fuera de /login.
    await expect(page).toHaveURL(/\/login\/?$/);
    // El form sigue visible (no se perdió el estado por un crash).
    await expect(page.getByLabel('Email')).toBeVisible();
    await expectNoCrash(page);
  });

  test('alternar a "Crear cuenta" cambia el formulario', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Crear\s+cuenta/i }).click();
    await expect(page.getByRole('button', { name: /Crear cuenta/i })).toBeVisible();
    await expectNoCrash(page);
  });
});

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

test.describe('Login autenticado (opt-in)', () => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Definí E2E_EMAIL y E2E_PASSWORD (entorno de prueba) para correr el flujo autenticado.'
  );

  test('ingresa y llega a un panel', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_EMAIL);
    await page.getByLabel('Contraseña').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /Ingresar/i }).click();

    // owner/staff -> /:slug/admin ; platform admin -> /master-panel ;
    // sin tienda -> /create-store. Cualquiera de esos es un login OK.
    await page.waitForURL(/\/(admin|master-panel|create-store)/, { timeout: 20_000 });
    await expectNoCrash(page);
  });
});
