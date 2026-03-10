# Configuração Necessária no Google Cloud Console

Para corrigir o problema de travamento no `/__/auth/handler` durante o login com o Google, você precisa autorizar o novo domínio do seu site no Google Cloud Console.

## Passo a Passo

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Certifique-se de que está selecionado o projeto correto no topo da página (provavelmente `ritmoup-b432b` ou similar).
3. Na lista de "IDs do cliente do OAuth 2.0" (OAuth 2.0 Client IDs), clique no cliente que você está usando para Web:
   - **Nome:** (Deve ser algo como "O cliente da Web (criado automaticamente pelo serviço do Google)" ou similar)
4. Procure a seção **URIs de redirecionamento autorizados** (Authorized redirect URIs).
5. Clique em **ADICIONAR URI** (ADD URI) e insira exatamente o seguinte endereço para o seu novo domínio:
   
   ```
   https://app.ritmoup.com.br/__/auth/handler
   ```

6. Na seção acima, **Origens JavaScript autorizadas** (Authorized JavaScript origins), certifique-se de ter adicionado:
   
   ```
   https://app.ritmoup.com.br
   ```

7. (Recomendado) Mantenha também o domínio padrão do Firebase para evitar problemas nos testes originais:
   
   ```
   https://ritmoup-b432b.firebaseapp.com/__/auth/handler
   ```

8. Clique em **SALVAR**.

> **Nota:** Pode levar alguns minutos (de 5 minutos a algumas horas) para que as alterações do Google Cloud se propaguem pelo sistema de autenticação. Após isso, o login no TWA não ficará mais no "loading".
