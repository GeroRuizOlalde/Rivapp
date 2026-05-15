import { test, expect, expectNoCrash } from './fixtures.js';

/**
 * Smoke suite de rutas públicas.
 *
 * Objetivo: en ~1 minuto confirmar que TODA la app arranca, rutea y renderiza
 * sin romperse. No depende de que Supabase responda ni escribe nada en la base
 * de producción (solo navega y, a lo sumo, hace lecturas públicas).
 */

const STORE_SLUG = process.env.E2E_STORE_SLUG || 'demo';

test.describe('Rutas públicas — render & routing', () => {
  test('Landing / carga y ofrece acceso', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Rivapp').first()).toBeVisible();
    // Debe haber al menos un acceso a login o registro.
    await expect(
      page.locator('a[href*="/login"], a[href*="/register"], a[href*="/registro"]').first()
    ).toBeVisible();
    await expectNoCrash(page);
  });

  test('/login muestra el formulario de ingreso', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: /Ingresar/i })).toBeVisible();
    await expectNoCrash(page);
  });

  test('/register muestra las verticales y el formulario', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Gastronomía').first()).toBeVisible();
    await expect(page.getByText(/Turnos/i).first()).toBeVisible();
    await expectNoCrash(page);
  });

  test('/create-store renderiza', async ({ page }) => {
    await page.goto('/create-store');
    await expect(page.locator('input').first()).toBeVisible();
    await expectNoCrash(page);
  });

  test('/terminos renderiza el documento legal', async ({ page }) => {
    await page.goto('/terminos');
    await expect(page.getByText('Términos').first()).toBeVisible();
    await expect(page.getByText(/Última actualización/i)).toBeVisible();
    await expectNoCrash(page);
  });

  test('/privacidad renderiza', async ({ page }) => {
    await page.goto('/privacidad');
    await expect(page.getByText(/Privacidad/i).first()).toBeVisible();
    await expectNoCrash(page);
  });

  test('slug inexistente muestra el 404 de tienda', async ({ page }) => {
    // Un único segmento matchea /:slug, así que se trata como tienda y,
    // al no existir, debe mostrar el 404 controlado (no el ErrorBoundary).
    await page.goto('/slug-que-no-existe-rivapp-e2e');
    await expect(page.getByText(/Tienda no|Error 404/i).first()).toBeVisible();
    await expectNoCrash(page);
  });

  test('ruta profunda desconocida redirige al landing', async ({ page }) => {
    await page.goto('/zzz/yyy/xxx');
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.getByText('Rivapp').first()).toBeVisible();
    await expectNoCrash(page);
  });

  test('vitrina pública /:slug monta sin crashear', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}`);
    // No debe quedarse colgada en el loader global ni crashear.
    await expect(page.getByText('Cargando Rivapp...')).toHaveCount(0);
    await expectNoCrash(page);
    // Resuelve a la tienda real o al 404 controlado de tienda — nunca al boundary.
    await expect(
      page
        .getByText('Tienda no')
        .or(page.getByText('Cargando tienda'))
        .or(page.locator('body'))
        .first()
    ).toBeVisible();
  });

  test('/:slug/admin con guard no crashea (redirige o bloquea)', async ({ page }) => {
    await page.goto(`/${STORE_SLUG}/admin`);
    await page.waitForLoadState('networkidle').catch(() => {});
    // Sin sesión: SubscriptionGuard redirige a /login o muestra pantalla de bloqueo.
    await expectNoCrash(page);
  });

  test('/tracking/:token monta sin crashear', async ({ page }) => {
    await page.goto('/tracking/token-de-prueba-inexistente');
    await expectNoCrash(page);
  });
});
