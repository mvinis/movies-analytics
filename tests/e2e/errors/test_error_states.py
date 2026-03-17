import pytest
from playwright.sync_api import Page, expect
from tests.e2e.pages.overview_page import OverviewPage

def test_should_show_error_ui_when_api_fails(page: Page):
    # 1. INTERCEPTAÇÃO: Antes de navegar, é informado ao browser: 
    # "Se alguém pedir /api/movies, retorne um erro 500 ou aborte"
    page.route("**/api/movies", lambda route: route.abort())

    overview = OverviewPage(page)
    overview.navigate()

    # 2. VALIDAÇÃO: O container de erro deve aparecer
    expect(overview.error_container).to_be_visible()
    
    # 3. VALIDAÇÃO: O botão de retry deve estar lá
    expect(overview.retry_button).to_be_visible()
    
    print("✅ Interface de erro validada com sucesso!")

def test_should_recover_from_error_on_retry(page: Page):
    # 1. Primeiro bloqueamos a API
    page.route("**/api/movies", lambda route: route.abort())
    
    overview = OverviewPage(page)
    overview.navigate()
    expect(overview.error_container).to_be_visible()

    # 2. Limpa o bloqueio para o servidor voltar
    page.unroute("**/api/movies")

    # 3. Clica no botão
    overview.retry_button.click()

    # 4. VALIDAÇÃO: O Top 10 deve aparecer após o Reconectar
    expect(page.locator("#top-10-popular")).to_be_visible()
    print("✅ Recuperação de erro (Retry) funcionando!")