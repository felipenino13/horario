import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ year: string }> };

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { year } = await params;

  if (!/^\d{4}$/.test(year) || Number(year) < 2000 || Number(year) > 2100) {
    return NextResponse.json({ error: "Año no válido" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/CO`,
      { next: { revalidate: 86400 } },
    );

    if (!response.ok) {
      throw new Error(`Nager.Date respondió ${response.status}`);
    }

    const holidays = (await response.json()) as NagerHoliday[];
    return NextResponse.json(
      holidays.map(({ date, localName, name }) => ({ date, localName, name })),
    );
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar los festivos de Colombia" },
      { status: 503 },
    );
  }
}
