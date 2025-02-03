# Savings Calculator for Certificados de Aforro

Este website permite-lhe calcular o valor atual dos seus Certificados de Aforro de forma simples e rápida.

## O que são Certificados de Aforro?

Os Certificados de Aforro são instrumentos de dívida pública criados pelo Estado Português com o objetivo de captar a poupança das famílias. Características principais:

- São distribuídos a retalho (colocados diretamente junto dos aforradores)
- Têm montantes mínimos de subscrição reduzidos
- Só podem ser emitidos a favor de particulares
- Não são transmissíveis exceto em caso de falecimento do titular

A emissão de Certificados de Aforro pode ser efetuada através de:
- Balcões dos CTT - Correios de Portugal
- Espaços Cidadão
- Canais digitais do Banco de Investimento Global
- AforroNet (para aderentes)

## Como Usar o Website

O website oferece duas funcionalidades principais:

### 1. Consulta Pessoal (Personal Savings)

Para uso pessoal :)

### 2. Calculadora Pública (Upload Certificates)

Para qualquer utilizador que pretenda calcular o valor dos seus certificados:

1. Clique no separador "Upload Certificates"
2. Prepare um ficheiro Excel (.xlsx ou .csv) com os seus certificados no seguinte formato:
   ```
   | type | date       | units |
   |------|------------|-------|
   | b    | 08/10/2002 | 100   |
   | b    | 06/12/2002 | 100   |
   ```
   - type: tipo do certificado (ex: 'b')
   - date: data de subscrição (formato DD/MM/YYYY)
   - units: número de unidades subscritas
3. Carregue o ficheiro utilizando o botão "Choose File"
4. Clique em "Calculate" para obter o valor atual

### Notas Importantes:

- O cálculo é feito utilizando dados oficiais do IGCP
- Os valores são atualizados em tempo real
- Para maior segurança, nenhuma informação dos certificados é guardada no servidor
- O website utiliza HTTPS para garantir a segurança dos seus dados

## Licença

Este projeto está licenciado sob a MIT License - veja o ficheiro LICENSE para mais detalhes.
