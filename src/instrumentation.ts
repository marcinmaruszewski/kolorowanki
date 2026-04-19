export async function register() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_DEV_LOGIN === 'true'
  ) {
    throw new Error(
      'ENABLE_DEV_LOGIN=true jest niedozwolone w produkcji. Usuń tę zmienną z Dokploy env.',
    )
  }
}
