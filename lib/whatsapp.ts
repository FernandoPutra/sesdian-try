// lib/whatsapp.ts
// Place: /lib/whatsapp.ts
// ------------------------------------------------------------
// WhatsApp sender via Fonnte (default) or Wablas
// Set WA_PROVIDER=fonnte|wablas in .env
// ------------------------------------------------------------

interface WaResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsApp(
  phone: string,
  message: string,
): Promise<WaResult> {
  const provider = process.env.WA_PROVIDER ?? 'fonnte';

  try {
    if (provider === 'fonnte') {
      return await sendFonnte(phone, message);
    }
    if (provider === 'wablas') {
      return await sendWablas(phone, message);
    }
    return { success: false, error: `Unknown WA_PROVIDER: ${provider}` };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}

// ── Fonnte ─────────────────────────────────────────────────
async function sendFonnte(phone: string, message: string): Promise<WaResult> {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: process.env.FONNTE_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target: phone, message }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    return { success: false, error: json.reason ?? 'Fonnte error' };
  }
  return { success: true, messageId: json.id };
}

// ── Wablas ─────────────────────────────────────────────────
async function sendWablas(phone: string, message: string): Promise<WaResult> {
  const res = await fetch(`${process.env.WABLAS_URL}/api/send-message`, {
    method: 'POST',
    headers: {
      Authorization: process.env.WABLAS_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, message }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    return { success: false, error: json.message ?? 'Wablas error' };
  }
  return { success: true, messageId: json.data?.id };
}