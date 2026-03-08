# Configuração Necessária no Google Cloud Console

Para corrigir o erro `redirect_uri_mismatch`, você precisa autorizar o domínio do seu site no Google Cloud.

## Passo a Passo

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Certifique-se de que está selecionado o projeto correto (provavelmente `ritmoup-b432b` ou similar).
3. Na lista de "IDs do cliente do OAuth 2.0", clique no cliente que você está usando:
   - **ID:** `267724149504-9epovq2mrt3n7270mqljqlo9f6042o0o.apps.googleusercontent.com`
   - **Nome:** (Deve ser algo como "RitmoUp Web" ou similar)
4. Procure a seção **URIs de redirecionamento autorizados**.
5. Clique em **ADICIONAR URI** e cole exatamente este endereço que apareceu no erro:
   
   ```
   https://ritmoup.website/__/auth/handler
   ```

6. (Recomendado) Adicione também o domínio padrão do Firebase para evitar problemas futuros:
   
   ```
   https://ritmoup-b432b.firebaseapp.com/__/auth/handler
   ```

7. Na seção **Origens JavaScript autorizadas**, verifique se o seu domínio está lá:
   
   ```
   https://ritmoup.website
   ```

8. Clique em **SALVAR**.

> **Nota:** Pode levar alguns minutos (de 5 minutos a algumas horas) para que as alterações façam efeito.
