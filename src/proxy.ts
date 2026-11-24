import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and guards the application routes.
 * Server layouts check the session again, so a failure here never exposes data.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    if (!user && path.startsWith("/dashboard")) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
      return NextResponse.redirect(to);
    }
    if (user && (path === "/login" || path === "/signup")) {
      const to = request.nextUrl.clone();
      to.pathname = "/dashboard";
      to.search = "";
      return NextResponse.redirect(to);
    }
  } catch (err) {
    console.error("[proxy]", err);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
