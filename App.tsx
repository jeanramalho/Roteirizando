import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TextInput,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

/**
 * NOTE: chave inserida apenas para desenvolvimento/local.
 * Nunca exponha chaves em builds de produção.
 */
const statusBarHeight = StatusBar.currentHeight ?? 0;
const KEY_GPT = "AIzaSyAbf4wh8xndx1i5ypZV4QzaSTiT1BsM7AI";

/* Tipo para o JSON esperado do modelo */
type DayObj = { day: number; places: string[] };
type ItineraryRoute = { title: string; itinerary: DayObj[] };
type ParsedRoutes = {
  city?: string;
  days?: number;
  routes?: ItineraryRoute[];
};

export default function App(): JSX.Element {
  const [city, setCity] = useState<string>("");
  const [days, setDays] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [travel, setTravel] = useState<string>(""); // fallback text
  const [routesParsed, setRoutesParsed] = useState<ParsedRoutes | null>(null);

  /**
   * Build prompt that instructs the model to return ONLY a JSON object
   * with a strict structure. Kept concise for reliability.
   */
  function buildPromptForJSON(cityName: string, daysNumber: number): string {
    return `Por favor, gere APENAS um JSON válido (sem texto extra) com ideias de roteiros para a cidade ${cityName} para ${daysNumber} dias.
O JSON deve ter este formato exato:
{
  "city": "<nome da cidade>",
  "days": <numero de dias>,
  "routes": [
    {
      "title": "<título curto do roteiro>",
      "itinerary": [
         {"day": 1, "places": ["Lugar A - breve", "Lugar B - breve"]},
         {"day": 2, "places": ["Lugar C", "Lugar D"]}
      ]
    }
  ]
}
Retorne somente o JSON.`;
  }

  /**
   * Robust JSON extraction strategy:
   * - removes markdown fences
   * - handles escaped JSON strings (\" and \\n)
   * - attempts multiple parse passes and extracts first {...} or [...]
   */
  function tryParseJsonFromText(text: string): ParsedRoutes | null {
    if (!text || typeof text !== "string") return null;

    let attempt = text.trim();

    // remove markdown fences ```json ... ```
    attempt = attempt.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");

    // if wrapped in quotes, remove outer quotes
    if (attempt.startsWith('"') && attempt.endsWith('"')) {
      attempt = attempt.slice(1, -1);
    }

    // Try multiple passes: parse -> unescape -> extract block -> parse
    for (let i = 0; i < 6; i++) {
      // try direct JSON.parse
      try {
        const parsed = JSON.parse(attempt);
        if (typeof parsed === "string") {
          // parsed is still a JSON string, continue loop with its content
          attempt = parsed;
          continue;
        }
        // parsed is object/array
        return parsed as ParsedRoutes;
      } catch {
        // not direct JSON; try unescaping common sequences
        const unescaped = attempt
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");

        if (unescaped !== attempt) {
          attempt = unescaped;
          continue;
        }

        // try to extract first {...} block
        const firstBrace = attempt.indexOf("{");
        const lastBrace = attempt.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const candidate = attempt.substring(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(candidate) as ParsedRoutes;
          } catch {
            // ignored - fallthrough to bracket attempt
          }
        }

        // try to extract first [...] array
        const firstBracket = attempt.indexOf("[");
        const lastBracket = attempt.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          const candidateArr = attempt.substring(firstBracket, lastBracket + 1);
          try {
            const parsedArr = JSON.parse(candidateArr);
            // if top-level is array but our structure expects object with routes,
            // try to wrap it: { routes: parsedArr }
            if (Array.isArray(parsedArr)) {
              return { routes: parsedArr } as ParsedRoutes;
            }
          } catch {
            // ignored
          }
        }

        // no progress; break loop
        break;
      }
    }

    // final aggressive regex extraction
    const braceMatch = attempt.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as ParsedRoutes;
      } catch {
        // ignored
      }
    }

    return null;
  }

  /**
   * Fallback text formatter: if the response can be parsed into JSON,
   * return pretty-printed JSON. Otherwise return trimmed text.
   */
  function makePrettyFallback(text: string): string {
    const parsed = tryParseJsonFromText(text);
    if (parsed) {
      try {
        return JSON.stringify(parsed, null, 2);
      } catch {
        // fallback to raw trimmed text
      }
    }
    return text.trim();
  }

  /**
   * Primary action: calls Gemini REST endpoint directly and processes result.
   * generationConfig is used per Gemini REST expectations.
   */
  async function handleGenerate(): Promise<void> {
    if (city.trim() === "") {
      Alert.alert("Atenção", "Preencha o nome da cidade!");
      return;
    }

    setTravel("");
    setRoutesParsed(null);
    setLoading(true);
    Keyboard.dismiss();

    const prompt = buildPromptForJSON(city.trim(), Number(days.toFixed(0)));

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": KEY_GPT,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              topP: 1.0,
              topK: 40,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errText}`);
      }

      const data = await resp.json();

      // attempt to extract main textual content from possible shapes
      // Candidate shapes observed: data.candidates[0].content[0].parts[0].text
      // or data.output[0].content[0].text, etc.
      let text: string;
      try {
        text =
          (data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text as string) ??
          (data?.output?.[0]?.content?.[0]?.text as string) ??
          (data?.candidates?.[0]?.content?.[0]?.text as string) ??
          JSON.stringify(data);
      } catch {
        text = JSON.stringify(data);
      }

      // first attempt: robust parse
      const parsed = tryParseJsonFromText(String(text));

      if (parsed && parsed.routes && Array.isArray(parsed.routes) && parsed.routes.length > 0) {
        setRoutesParsed(parsed);
        setTravel("");
      } else {
        // fallback: produce pretty string (either pretty JSON or cleaned text)
        const pretty = makePrettyFallback(String(text));
        setRoutesParsed(null);
        setTravel(pretty);
      }
    } catch (err: any) {
      console.error("handleGenerate error:", err);
      setRoutesParsed(null);
      setTravel("Ocorreu um erro ao gerar o roteiro. Verifique o console para detalhes.");
      Alert.alert("Erro", String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Renders parsed routes with clear hierarchy: route title -> day -> places.
   * Keeps layout and spacing consistent with original design.
   */
  function RenderParsedRoutes({ parsed }: { parsed: ParsedRoutes | null }) {
    if (!parsed) return null;
    const routes = Array.isArray(parsed.routes) ? parsed.routes : [];

    return (
      <View style={styles.content}>
        <Text style={styles.title}>Roteiro da viagem 👇</Text>

        {parsed.city ? (
          <Text style={{ fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
            {parsed.city} — {parsed.days ?? days} dias
          </Text>
        ) : null}

        {routes.length === 0 ? (
          <Text>Nenhum roteiro encontrado no JSON.</Text>
        ) : (
          routes.map((route, idx) => (
            <View key={idx} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 6 }}>{route.title}</Text>

              {Array.isArray(route.itinerary) &&
                route.itinerary.map((dayObj, dIdx) => (
                  <View key={dIdx} style={{ marginLeft: 8, marginBottom: 6 }}>
                    <Text style={{ fontWeight: "600" }}>Dia {dayObj.day}:</Text>
                    {Array.isArray(dayObj.places) &&
                      dayObj.places.map((place, pIdx) => (
                        <Text key={pIdx} style={{ marginLeft: 8, lineHeight: 20 }}>
                          • {place}
                        </Text>
                      ))}
                  </View>
                ))}
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="#F1F1F1" />
      <Text style={styles.heading}>Roteirizando</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Cidade destino</Text>
        <TextInput
          placeholder="Ex: Campo Grande, MS"
          style={styles.input}
          value={city}
          onChangeText={(text) => setCity(text)}
          editable={!loading}
        />

        <Text style={styles.label}>
          Tempo de estadia: <Text style={styles.days}> {days.toFixed(0)} </Text> dias
        </Text>
        <Slider
          minimumValue={1}
          maximumValue={7}
          minimumTrackTintColor="#009688"
          maximumTrackTintColor="#000000"
          value={days}
          onValueChange={(value) => setDays(value)}
          disabled={loading}
        />
      </View>

      <Pressable style={styles.button} onPress={handleGenerate} disabled={loading}>
        <Text style={styles.buttonText}>Gerar roteiro</Text>
        <MaterialIcons name="travel-explore" size={24} color="#FFF" />
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, marginTop: 4 }}
        style={styles.containerScroll}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.content}>
            <Text style={styles.title}>Carregando roteiro...</Text>
            <ActivityIndicator color="#000" size="large" />
          </View>
        )}

        {routesParsed ? <RenderParsedRoutes parsed={routesParsed} /> : null}

        {!routesParsed && travel ? (
          <View style={styles.content}>
            <Text style={styles.title}>Roteiro da viagem 👇</Text>
            <Text style={{ lineHeight: 24, fontFamily: undefined }}>{travel}</Text>
          </View>
        ) : null}
      </ScrollView>

      <Text style={{ fontSize: 12, color: "#666", marginTop: 8, width: "90%", textAlign: "center" }}>
        Nota: este app realiza a chamada DIRETA ao modelo. Não coloque a chave no app em produção.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    paddingTop: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
    paddingTop: Platform.OS === "android" ? statusBarHeight : 54,
  },
  form: {
    backgroundColor: "#FFF",
    width: "90%",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#94a3b8",
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  days: {
    backgroundColor: "#F1f1f1",
  },
  button: {
    backgroundColor: "#FF5656",
    width: "90%",
    borderRadius: 8,
    flexDirection: "row",
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
  },
  content: {
    backgroundColor: "#FFF",
    padding: 16,
    width: "100%",
    marginTop: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
  },
  containerScroll: {
    width: "90%",
    marginTop: 8,
  },
});
