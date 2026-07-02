1. Mapear onde o RAWG ainda é usado nas rotas, services e types.
2. Implementar a obtenção e o reuso do access token da Twitch usando TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET.
3. Criar o cliente da IGDB com headers Client-ID, Authorization: Bearer ... e Content-Type: text/plain.
4. Adaptar a query de paginação com limit 50 e offset = (page - 1) \* limit.
5. Substituir as rotas/serviços que consumiam RAWG pelo novo fluxo da IGDB.
6. Remover dependências e variáveis de configuração antigas do RAWG.
7. Validar a resposta final da API e ajustar qualquer mapeamento de campos como cover.image_id, genres.name, platforms.name, total_rating e first_release_date.
   (lembrando de usar as rotas da twitch para pegar o Token)
