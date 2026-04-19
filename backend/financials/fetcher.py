import yfinance as yf


def get_financial_summary(ticker: str) -> dict:
    try:
        stock = yf.Ticker(ticker)
        income = stock.quarterly_income_stmt

        summary = {
            "ticker": ticker,
            "company_name": stock.info.get("longName", ticker),
            "quarters": [],
            "data_quality": "insufficient",
            "quarters_available": 0,
            "warning": None
        }

        available_cols = list(income.columns)
        max_quarters = min(len(available_cols), 12)

        for col in available_cols[:max_quarters]:
            quarter_date = str(col)[:10]

            try:
                revenue = income.loc["Total Revenue", col] if "Total Revenue" in income.index else None
                gross_profit = income.loc["Gross Profit", col] if "Gross Profit" in income.index else None
                net_income = income.loc["Net Income", col] if "Net Income" in income.index else None

                gross_margin = None
                if revenue and gross_profit and revenue != 0:
                    gross_margin = round((gross_profit / revenue) * 100, 1)

                summary["quarters"].append({
                    "date": quarter_date,
                    "revenue": int(revenue) if revenue else None,
                    "gross_profit": int(gross_profit) if gross_profit else None,
                    "net_income": int(net_income) if net_income else None,
                    "gross_margin_pct": gross_margin
                })
            except Exception as e:
                print(f"Error parsing quarter {quarter_date}: {e}")
                continue

        summary["quarters_available"] = len(summary["quarters"])

        if summary["quarters_available"] == 0:
            summary["data_quality"] = "none"
            summary["warning"] = "No financial data found. Company may be private, too new, or ticker is incorrect."
        elif summary["quarters_available"] < 4:
            summary["data_quality"] = "insufficient"
            summary["warning"] = f"Only {summary['quarters_available']} quarters available. Company may be too new to assess credibility reliably."
        elif summary["quarters_available"] < 8:
            summary["data_quality"] = "limited"
            summary["warning"] = f"Only {summary['quarters_available']} quarters available. Credibility assessment will be limited."
        else:
            summary["data_quality"] = "sufficient"
            summary["warning"] = None

        revenues = [q["revenue"] for q in summary["quarters"] if q["revenue"]]
        if len(revenues) >= 2:
            growth = ((revenues[0] - revenues[-1]) / abs(revenues[-1])) * 100
            summary["revenue_trend"] = f"{'+' if growth > 0 else ''}{round(growth, 1)}% over last {len(revenues)} quarters"
        else:
            summary["revenue_trend"] = "insufficient data"

        margins = [q["gross_margin_pct"] for q in summary["quarters"] if q["gross_margin_pct"]]
        if len(margins) >= 2:
            margin_change = margins[0] - margins[-1]
            summary["margin_trend"] = f"{'improving' if margin_change > 0 else 'declining'} ({'+' if margin_change > 0 else ''}{round(margin_change, 1)}pp over last {len(margins)} quarters)"
        else:
            summary["margin_trend"] = "insufficient data"

        return summary

    except Exception as e:
        print(f"Error fetching financials for {ticker}: {e}")
        return {
            "ticker": ticker,
            "company_name": ticker,
            "quarters": [],
            "quarters_available": 0,
            "data_quality": "none",
            "warning": f"Could not fetch data: {str(e)}",
            "revenue_trend": "unavailable",
            "margin_trend": "unavailable"
        }


def format_for_claude(financial_summary: dict) -> str:
    lines = [
        f"Company: {financial_summary.get('company_name', financial_summary['ticker'])}",
        f"Data quality: {financial_summary.get('data_quality', 'unknown')}",
        f"Quarters available: {financial_summary.get('quarters_available', 0)}",
    ]

    if financial_summary.get("warning"):
        lines.append(f"Warning: {financial_summary['warning']}")

    if not financial_summary.get("quarters"):
        lines.append("No historical financial data available.")
        return "\n".join(lines)

    lines += [
        f"Revenue trend: {financial_summary.get('revenue_trend', 'unknown')}",
        f"Margin trend: {financial_summary.get('margin_trend', 'unknown')}",
        "",
        "Quarterly data (most recent first):"
    ]

    for q in financial_summary["quarters"]:
        rev = f"${q['revenue']:,}" if q['revenue'] else "N/A"
        margin = f"{q['gross_margin_pct']}%" if q['gross_margin_pct'] else "N/A"
        lines.append(f"  {q['date']}: Revenue {rev}, Gross Margin {margin}")

    return "\n".join(lines)
