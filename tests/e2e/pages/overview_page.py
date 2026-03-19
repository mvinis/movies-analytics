from playwright.sync_api import Page, expect

class OverviewPage:
    def __init__(self, page: Page):
        self.page = page
        # Seletores (IDs ou Classes)
        self.tab_link = page.get_by_role("link", name="Visão Geral")
        self.top_movies_section = page.locator("#top-10-popular")
        self.movie_cards = page.locator(".movie-data-row")
        self.error_container = page.get_by_role("heading", name="Conexão Interrompida")
        self.retry_button = page.get_by_role("button", name="Tentar Reconectar")

    def navigate(self):
        self.page.goto("http://localhost:5173")
        self.tab_link.click()

    def get_top_movie_titles(self):
        # Retorna os títulos dos filmes visíveis
        return self.movie_cards.locator("h3").all_inner_texts()