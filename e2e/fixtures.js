import { test as base, expect } from '@playwright/test';

/**
 * Fixture base: en cada test escucha excepciones JS no capturadas
 * (`pageerror`). Si la app tira una excepción de runtime, el test falla
 * aunque la aserción visual pase. Esto convierte cada navegación en un
 * smoke test real de "no se rompió nada".
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await use(page);

    expect(
      pageErrors,
      `Excepciones JS no capturadas:\n${pageErrors.map((e) => e.stack || e.message).join('\n---\n')}`
    ).toHaveLength(0);
  },
});

export { expect };

/** Verifica que el ErrorBoundary global NO se activó (la app no crasheó). */
export async function expectNoCrash(page) {
  await expect(page.getByText('Algo salió mal')).toHaveCount(0);
}
