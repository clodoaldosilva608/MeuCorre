#!/usr/bin/env python3
"""
Atualiza as URLs dos 3 produtos no Supabase com os links reais da Kiwify.
"""

import psycopg2
import os

# Connection string (Pooler — porta 6543)
DATABASE_URL = "postgresql://postgres.pjetmhsevohaqtqfbxrr:Silva88677488@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# URLs reais confirmadas na sessão de 17/08/2026
UPDATES = [
    {
        "id": "ebook_financas_entregador",
        "url": "https://pay.kiwify.com.br/D7AebQz",
        "notes": "Produto ativo na Kiwify. Entrega automatica via Area de Membros. Afiliados habilitados: 50% comissao, cookie 30 dias. Link real confirmado em 17/08/2026.",
    },
    {
        "id": "course_gestao_financas",
        "url": "https://pay.kiwify.com.br/qUmn5jr",
        "notes": "Produto ativo na Kiwify. Entrega automatica via Area de Membros. Afiliados habilitados: 30% comissao, cookie 30 dias. Link real confirmado em 17/08/2026.",
    },
    {
        "id": "course_premium_avancado",
        "url": "https://pay.kiwify.com.br/Ku7IAdQ",
        "notes": "Produto ativo na Kiwify. Entrega automatica via Area de Membros (Modulo 1 publicado). Afiliados habilitados: 30% comissao, cookie 30 dias. Link real confirmado em 17/08/2026. Modulos 2-15 pendentes de producao.",
        "price": 247.00,
    },
]

def main():
    print("Conectando ao Supabase...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        cur = conn.cursor()
        print("✅ Conectado!")

        for update in UPDATES:
            product_id = update["id"]
            url = update["url"]
            notes = update["notes"]
            price = update.get("price")

            if price is not None:
                cur.execute(
                    """
                    UPDATE "AffiliateProduct"
                    SET url = %s,
                        notes = %s,
                        price = %s,
                        active = true,
                        featured = true,
                        "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (url, notes, price, product_id),
                )
            else:
                cur.execute(
                    """
                    UPDATE "AffiliateProduct"
                    SET url = %s,
                        notes = %s,
                        active = true,
                        featured = true,
                        "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (url, notes, product_id),
                )

            print(f"  ✅ {product_id}: URL atualizada → {url}")

        conn.commit()
        print("\n✅ Commit das alterações no banco!")

        # Verificação final
        cur.execute("""
            SELECT id, name, price, url, active, featured
            FROM "AffiliateProduct"
            WHERE id IN ('ebook_financas_entregador', 'course_gestao_financas', 'course_premium_avancado')
            ORDER BY price
        """)
        rows = cur.fetchall()
        print("\n=== Verificação final ===")
        for row in rows:
            print(f"  • {row[1]}: R$ {row[2]} | {row[3]} | active={row[4]} | featured={row[5]}")

        cur.close()
        conn.close()
        print("\n🎉 URLs atualizadas com sucesso!")

    except Exception as e:
        print(f"❌ Erro: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    main()
