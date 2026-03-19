from playwright.sync_api import Page, expect
from tests.e2e.pages.overview_page import OverviewPage

def test_user_can_see_top_10_popular_movies(page: Page):
    overview = OverviewPage(page)
    overview.navigate()

    # ESPERA o loading sumir antes de seguir
    page.wait_for_selector("#loading-screen", state="detached")

    # Agora sim ele verifica os cards
    expect(overview.top_movies_section).to_be_visible()
    expect(overview.movie_cards).to_have_count(10)

    # 3. Verifica se os valores de popularidade estão presentes
    # Supondo que você tem um elemento com classe .pop-score
    first_score = overview.movie_cards.first.locator(".pop-score")
    expect(first_score).not_to_be_empty()
    
    print(f"✅ Top 10 exibido com sucesso!")