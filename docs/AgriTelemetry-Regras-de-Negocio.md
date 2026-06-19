# AgriTelemetry — Documento de Regras de Negócio

**Versão:** 1.0
**Domínio:** Telemetria de frota de máquinas agrícolas conectadas
**Propósito:** Definir, de forma testável e inequívoca, as regras que governam a ingestão, o processamento, o armazenamento, a disponibilização e o monitoramento de dados de telemetria de máquinas agrícolas.

---

## 1. Contexto e escopo

O AgriTelemetry recebe leituras de sensores emitidas por máquinas agrícolas conectadas (tratores, colheitadeiras, pulverizadores, plantadeiras), processa esses dados de forma confiável e os disponibiliza para monitoramento de saúde da frota, detecção precoce de problemas e apoio à decisão operacional.

O princípio que orienta todas as regras: **na agricultura, a indisponibilidade de uma máquina dentro da janela de plantio ou colheita tem custo desproporcional** — pode significar perda direta de safra. Por isso o sistema prioriza confiabilidade de ingestão, integridade dos dados e detecção precoce de anomalias acima de qualquer outra característica.

### Fora de escopo (decisão consciente)
Predição por machine learning, streaming analítico em tempo real, faturamento, e gestão completa de notificações multicanal estão fora desta versão. O sistema *sinaliza* condições; a entrega de notificações externas é tratada como ponto de extensão.

---

## 2. Glossário

| Termo | Definição |
|---|---|
| **Máquina** | Ativo físico conectado que emite telemetria, unicamente identificado na frota. |
| **Organização (org)** | Entidade proprietária de um conjunto de máquinas e seus dados (fazenda, cooperativa, operador de frota). |
| **Leitura (reading)** | Um valor de um sensor, num instante, vindo de uma máquina. |
| **Evento** | A unidade de ingestão; carrega uma ou mais leituras e um identificador único de evento. |
| **Anomalia** | Leitura que viola um limite operacional definido para seu tipo de sensor. |
| **DTC** | Diagnostic Trouble Code — código de falha emitido pela máquina. |
| **Horas de operação** | Contador monotônico de horas de motor (engine hours), análogo a um odômetro. |

### Convenções
- **Severidade:** `INFO` < `WARNING` < `CRITICAL`. Toda anomalia carrega exatamente uma severidade.
- **Estado da máquina:** `ATIVA`, `OCIOSA`, `OFFLINE`.
- **Unidades canônicas:** temperatura °C, pressão hidráulica bar, nível de combustível/DEF %, tensão V, rotação rpm, velocidade km/h, horas h, volume de combustível L.
- **Tempo:** todos os timestamps em ISO 8601, UTC. O fuso é responsabilidade da camada de apresentação.
- **Convenção de IDs:** `BR-<ÁREA>-<NN>`.

---

## 3. Identidade e cadastro de máquinas (BR-MAQ)

- **BR-MAQ-01** — Toda máquina deve ser unicamente identificada por um `machine_id` imutável atribuído no cadastro. Um `machine_id` nunca é reutilizado, mesmo após desativação.
- **BR-MAQ-02** — Toda máquina deve possuir, no mínimo: tipo (trator, colheitadeira, etc.), modelo, número de série e a organização proprietária.
- **BR-MAQ-03** — Toda leitura recebida deve referenciar uma máquina previamente cadastrada. Leituras de máquinas desconhecidas são rejeitadas na ingestão (ver BR-ING-07).
  - *Implicação técnica: integridade referencial entre leitura e máquina; é um teste de integração natural.*
- **BR-MAQ-04** — Uma máquina pode estar em um de três estados de ciclo de vida: `ATIVA_EM_CAMPO`, `EM_MANUTENCAO`, `DESATIVADA`. Máquinas `DESATIVADA` não aceitam novas leituras.
- **BR-MAQ-05** — Uma máquina pertence a exatamente uma organização em um dado momento. A transferência de propriedade preserva o histórico de telemetria, mas o acesso ao histórico segue a regra de propriedade vigente (ver BR-SEG).

---

## 4. Propriedade e isolamento de dados (BR-ORG)

- **BR-ORG-01** — Todo dado de telemetria pertence à organização proprietária da máquina que o gerou.
- **BR-ORG-02** — Uma organização só pode acessar dados das máquinas que possui. Nenhuma consulta pode retornar dados de outra organização, em nenhuma circunstância.
  - *Implicação: todo endpoint de leitura filtra obrigatoriamente por organização; ausência desse filtro é um defeito de segurança crítico.*
- **BR-ORG-03** — Operações de agregação (médias, totais da frota) são calculadas estritamente dentro da fronteira da organização.

---

## 5. Ingestão e validação de leituras (BR-ING)

- **BR-ING-01** — Toda leitura deve conter obrigatoriamente: `machine_id`, `sensor_type`, `value`, `timestamp` e `event_id`. A ausência de qualquer campo obrigatório torna a leitura inválida.
- **BR-ING-02** — `sensor_type` deve pertencer ao conjunto de tipos de sensor suportados (ver Apêndice A). Tipos desconhecidos são rejeitados.
- **BR-ING-03** — `value` deve ser numérico e estar dentro da faixa fisicamente plausível do tipo de sensor (ver Apêndice A). Valores fora da faixa plausível são tratados como dados corrompidos e rejeitados — distinto de anomalia (ver nota abaixo).
- **BR-ING-04** — `timestamp` não pode estar no futuro além de uma tolerância de relógio de **5 minutos**. Leituras com timestamp futuro além da tolerância são rejeitadas.
- **BR-ING-05** — `timestamp` não pode ser mais antigo que a janela de aceitação de **48 horas**. Leituras mais antigas são rejeitadas como atrasadas em excesso, para impedir reprocessamento de backlogs corrompidos.
  - *Rationale: redes rurais geram reenvios atrasados legítimos; 48h cobre o reenvio razoável sem abrir a porta para lixo histórico.*
- **BR-ING-06** — A API de ingestão deve **aceitar e enfileirar** a leitura válida, respondendo `202 Accepted`, sem gravá-la sincronamente. Nenhuma regra de negócio de processamento é aplicada na borda de ingestão.
  - *Rationale: desacoplamento, absorção de pico e baixa latência de resposta.*
- **BR-ING-07** — Leituras rejeitadas por validação (BR-ING-01 a 05, BR-MAQ-03) não entram na fila de processamento e retornam erro de validação ao emissor, com a causa identificada.
- **BR-ING-08** — A ingestão deve aceitar lotes (múltiplas leituras por requisição). A validação é por leitura: leituras válidas do lote são aceitas; inválidas são reportadas individualmente sem invalidar o lote inteiro.

> **Distinção crítica — dado corrompido × anomalia:** um valor *fisicamente impossível* (ex.: temperatura de motor de 5000 °C) é **corrompido** e deve ser **rejeitado na ingestão**. Um valor *possível, porém perigoso* (ex.: 125 °C) é uma **anomalia válida** e deve ser **aceito e sinalizado**. Confundir os dois é um erro de modelagem grave: anomalia é justamente o dado que mais interessa preservar.

---

## 6. Idempotência e integridade (BR-IDE)

- **BR-IDE-01** — Cada evento carrega um `event_id` único, gerado na origem (máquina). O sistema usa o `event_id` como chave de deduplicação.
- **BR-IDE-02** — Processar o mesmo `event_id` mais de uma vez deve produzir o mesmo resultado que processá-lo uma única vez. Nenhuma duplicata pode gerar registro duplicado.
  - *Implicação: o sistema assume entrega "pelo menos uma vez" e garante idempotência na aplicação, via restrição de unicidade no `event_id` no armazenamento primário.*
- **BR-IDE-03** — A verificação de unicidade do `event_id` deve ser fortemente consistente (executada contra o armazenamento primário, nunca contra réplica de leitura ou cache), sob pena de uma duplicata escapar pela janela de defasagem.
- **BR-IDE-04** — Uma leitura, uma vez persistida, é imutável. Correções se dão por nova leitura, nunca por alteração de registro histórico (telemetria é um log append-only).

---

## 7. Processamento e confiabilidade (BR-PRC)

- **BR-PRC-01** — O processamento de leituras é assíncrono e desacoplado da ingestão, executado por um consumidor independente.
- **BR-PRC-02** — Uma leitura só é considerada processada com sucesso após persistida no armazenamento durável. A confirmação (ack/delete da mensagem) só ocorre após a persistência.
  - *Rationale: se o consumidor falhar antes de confirmar, a leitura é reentregue e reprocessada — protegida pela idempotência (BR-IDE-02).*
- **BR-PRC-03** — Mensagens que falham repetidamente no processamento (mensagens-veneno) devem ser desviadas para uma fila morta (DLQ) após um número máximo de tentativas, sem bloquear o fluxo das demais.
- **BR-PRC-04** — O acúmulo de mensagens na DLQ deve ser observável e disparar alerta operacional, pois sinaliza falha sistêmica ou dado cronicamente malformado.
- **BR-PRC-05** — A perda de uma leitura válida e aceita é inaceitável. Em caso de falha de processamento, a leitura deve ser retida (na fila ou na DLQ) até resolução, nunca descartada silenciosamente.

---

## 8. Estado e disponibilidade da máquina (BR-EST)

- **BR-EST-01** — Uma máquina é considerada `ATIVA` quando emitiu ao menos uma leitura dentro da janela de atividade de **15 minutos**.
- **BR-EST-02** — Uma máquina que não emite leituras há mais que a janela de atividade, porém há menos que **2 horas**, é considerada `OCIOSA`.
- **BR-EST-03** — Uma máquina sem leituras há mais de **2 horas** durante período operacional é considerada `OFFLINE` e deve gerar sinalização, pois pode indicar falha de conectividade, defeito ou furto.
- **BR-EST-04** — O sistema deve manter, para cada máquina, a leitura mais recente de cada tipo de sensor, acessível com baixa latência (estado atual da frota).
  - *Implicação: candidato natural a cache de "estado quente" por máquina.*
- **BR-EST-05** — A transição de estado (ex.: `ATIVA` → `OFFLINE`) é derivada do tempo desde a última leitura, não declarada pela máquina.

---

## 9. Detecção de anomalias e severidade (BR-ANO)

- **BR-ANO-01** — Durante o processamento, cada leitura é avaliada contra os limites operacionais do seu tipo de sensor (Apêndice A). Uma leitura que viola um limite é marcada como anomalia com a severidade correspondente.
- **BR-ANO-02** — Os limites operacionais são configuráveis por tipo de sensor e podem ser sobrescritos por modelo de máquina, pois faixas seguras variam entre modelos.
- **BR-ANO-03** — A severidade segue a taxonomia: `WARNING` para desvio que exige atenção, `CRITICAL` para condição que exige ação imediata (risco de dano à máquina ou parada).
- **BR-ANO-04** — Um código de falha (DTC) emitido pela máquina é sempre registrado como anomalia, com severidade mínima `WARNING`, mapeada conforme a criticidade do código.
- **BR-ANO-05** — A avaliação de anomalia deve ser uma função pura e determinística da leitura e da configuração de limites vigente — mesma entrada, mesma saída.
  - *Rationale: isso a torna a regra de negócio ideal para cobertura por testes unitários.*
- **BR-ANO-06** — A detecção de anomalia não pode bloquear nem atrasar a persistência da leitura. Sinalizar é parte do processamento, não um pré-requisito da gravação.

---

## 10. Alertas e notificações (BR-ALR)

- **BR-ALR-01** — Toda anomalia `CRITICAL` deve ser disponibilizada para alerta imediato à organização proprietária.
- **BR-ALR-02** — Anomalias devem ser consultáveis por máquina, por organização, por severidade e por janela de tempo.
- **BR-ALR-03** — Para evitar fadiga de alerta, anomalias repetidas e contínuas da mesma condição na mesma máquina devem ser agrupadas/suprimidas dentro de uma janela configurável, em vez de gerar um alerta por leitura.
  - *Rationale: um motor superaquecido emite a condição a cada segundo; o operador precisa de um alerta, não de mil.*
- **BR-ALR-04** — A entrega externa de notificações (e-mail, SMS, push) é um ponto de extensão: cada canal/consumidor interessado recebe os eventos de anomalia de forma independente, sem acoplar-se ao processamento principal.

---

## 11. Manutenção preditiva e preventiva (BR-MAN)

- **BR-MAN-01** — O sistema deve rastrear as horas de operação acumuladas de cada máquina a partir da telemetria.
- **BR-MAN-02** — As horas de operação são monotônicas e não decrescem. Uma leitura de horas inferior à última registrada para a máquina é tratada como dado inconsistente e sinalizada (possível troca de componente ou erro de sensor).
- **BR-MAN-03** — O sistema deve permitir a definição de intervalos de manutenção baseados em horas de operação (ex.: revisão a cada 250 h) e sinalizar quando uma máquina se aproxima ou ultrapassa o intervalo.
- **BR-MAN-04** — Padrões persistentes de desvio (ex.: temperatura média de operação subindo ao longo de dias) devem ser observáveis via agregação histórica, como base para manutenção preditiva.

---

## 12. Geolocalização e geofencing (BR-GEO)

- **BR-GEO-01** — Quando a leitura inclui posição (latitude/longitude), o sistema deve registrá-la associada ao instante, formando o rastro da máquina.
- **BR-GEO-02** — Uma organização pode definir cercas virtuais (geofences) representando talhões, fazendas ou áreas autorizadas.
- **BR-GEO-03** — A saída de uma máquina de sua geofence autorizada fora de janela operacional deve gerar anomalia, por indicar possível uso indevido ou furto — risco material relevante no domínio agrícola.
- **BR-GEO-04** — Coordenadas devem ser validadas quanto à faixa plausível (latitude −90..90, longitude −180..180); valores fora disso são dados corrompidos (BR-ING-03).

---

## 13. Retenção, agregação e consulta de dados (BR-DAT)

- **BR-DAT-01** — O sistema deve disponibilizar, no mínimo: a última leitura por máquina, o histórico por máquina dentro de uma janela de tempo, agregações (média/mín/máx) por período, e a lista de anomalias.
- **BR-DAT-02** — Toda consulta de histórico ou agregação deve ser parametrizada por janela de tempo, com limite máximo de intervalo para proteger o sistema de varreduras irrestritas.
- **BR-DAT-03** — Dados brutos de telemetria têm valor decrescente com o tempo. O sistema deve suportar uma política de retenção: dados brutos retidos por um período (ex.: 90 dias) e, após isso, mantidos apenas de forma agregada/sumarizada.
- **BR-DAT-04** — Consultas devem refletir consistência eventual: dados recém-ingeridos podem ainda não aparecer enquanto não processados. Esta é uma característica esperada do sistema, não um defeito.
- **BR-DAT-05** — Resultados de consulta de leituras devem ser ordenáveis por timestamp e paginados; nenhuma consulta retorna conjunto ilimitado.

---

## 14. Segurança e acesso (BR-SEG)

- **BR-SEG-01** — Todo acesso à API exige autenticação. Nenhum endpoint de dados é público.
- **BR-SEG-02** — A autorização é por organização (BR-ORG-02): a identidade autenticada determina quais máquinas e dados são visíveis.
- **BR-SEG-03** — Credenciais e segredos do sistema nunca são armazenados em texto plano em código ou configuração versionada; devem residir em cofre de segredos.
- **BR-SEG-04** — Toda rejeição de ingestão e todo acesso a dados sensíveis devem ser auditáveis (registro de quem, o quê, quando).

---

## 15. Observabilidade e níveis de serviço (BR-OBS)

- **BR-OBS-01** — A ingestão deve responder dentro de uma meta de latência (ex.: p95 abaixo de 200 ms), por ser uma operação de "aceitar e enfileirar".
- **BR-OBS-02** — O atraso de processamento (tempo entre ingestão e dado consultável) deve ser monitorado; seu crescimento sustentado indica que o consumidor não acompanha a vazão.
- **BR-OBS-03** — A profundidade da fila, a idade da mensagem mais antiga, a taxa de reentrega e a profundidade da DLQ devem ser métricas observáveis com alertas.
- **BR-OBS-04** — Deve ser possível rastrear o trajeto de uma leitura, da ingestão à persistência, atravessando a fronteira assíncrona (tracing distribuído).
- **BR-OBS-05** — O sistema deve expor um indicador de saúde (health check) que reflita a disponibilidade de suas dependências críticas (armazenamento, fila).

---

## Apêndice A — Limites por tipo de sensor (valores padrão configuráveis)

> Os valores abaixo são padrões de referência; limites efetivos são configuráveis por tipo e por modelo (BR-ANO-02). "Faixa plausível" governa rejeição por corrupção (BR-ING-03); "warning/critical" governam anomalia (BR-ANO-01).

| Tipo de sensor | Unidade | Faixa plausível | Warning | Critical |
|---|---|---|---|---|
| Temperatura do motor | °C | −40 a 200 | > 110 | > 120 |
| Rotação do motor | rpm | 0 a 3500 | > 2600 | > 2900 |
| Pressão do óleo | bar | 0 a 10 | < 1.0 | < 0.5 |
| Pressão hidráulica | bar | 0 a 300 | fora de 150–250 | fora de 100–280 |
| Nível de combustível | % | 0 a 100 | < 15 | < 5 |
| Nível de DEF (Arla) | % | 0 a 100 | < 10 | < 3 |
| Tensão da bateria | V | 0 a 16 | < 11.8 | < 11.0 |
| Velocidade de deslocamento | km/h | 0 a 60 | — | — |
| Horas de operação | h | 0 a 100000 | aproxima do intervalo | ultrapassa o intervalo |
| Código de falha (DTC) | — | conjunto válido | qualquer DTC | DTC crítico |

---

## Apêndice B — Como usar este documento

Cada regra desta lista é, deliberadamente, **testável** — essa é a razão de estarem numeradas e escritas de forma declarativa.

- **Modelo de dados:** as seções 3, 4, 5 e 6 ditam as entidades (`machines`, `organizations`, `sensor_readings`, `anomalies`) e suas restrições (unicidade, integridade referencial, imutabilidade).
- **Testes unitários:** regras de função pura — sobretudo BR-ANO (anomalia), BR-EST (derivação de estado), BR-MAN-02 (monotonicidade de horas), BR-ING-03/04/05 (validação) — mapeiam quase um-para-um para casos de teste.
- **Testes de integração:** BR-MAQ-03 (integridade referencial), BR-IDE-02/03 (idempotência), BR-PRC-02 (persistência antes do ack).
- **Testes E2E:** BR-DAT-04 (consistência eventual exige asserção com espera) e o caminho ingestão → processamento → consulta.
- **Conversa de entrevista:** cada regra carrega um "porquê" de domínio. Saber recitar a *necessidade de negócio* por trás de uma decisão técnica é o que distingue quem modelou o domínio de quem apenas codou.

*Fim do documento.*
