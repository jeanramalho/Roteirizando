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
import Markdown from "react-native-markdown-display";

/**
 * NOTE (DEV): API key must not be shipped with production builds.
 * Use env vars / backend proxy / secrets manager for production.
 */
const statusBarHeight = StatusBar.currentHeight ?? 0;
const KEY_GPT = "api-key-here";

type ParsedRoutes = {
  city?: string;
  days?: number;
  routes?: Array<{ title?: string; itinerary?: Array<{ day?: number; places?: string[] }> }>;
};

export default function App() {
  const [city, setCity] = useState<string>("");
  const [days, setDays] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [travel, setTravel] = useState<string>(""); // markdown/plain fallback
  const [routesParsed, setRoutesParsed] = useState<ParsedRoutes | null>(null);

  /**
   * Simple prompt requesting Markdown-only response.
   * The model is asked to return Markdown; we render that Markdown directly.
   */
  function buildPromptMarkdown(cityName: string, daysNumber: number): string {
    return `Gere ${daysNumber} ideias de roteiros curtos para a cidade ${cityName} para ${daysNumber} dias.
Responda SOMENTE em Markdown, sem explicações adicionais.
Formato sugerido:
**Roteiro 1 — Título**
- Ponto 1
- Ponto 2

Escreva em português.`;
  }

  /**
   * Extract textual content from typical Gemini response shapes.
   * Observed shapes:
   * - data.candidates[0].content[0].parts[0].text
   * - data.output[0].content[0].text
   * Fall back to full stringify only for debugging.
   */
  function extractTextFromResponse(data: any): string {
    try {
      const candidateText =
        data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text ??
        data?.output?.[0]?.content?.[0]?.text ??
        data?.candidates?.[0]?.content?.[0]?.text;
      if (typeof candidateText === "string") return candidateText;
      return JSON.stringify(data, null, 2);
    } catch {
      return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Clean and unescape the model text:
   * - remove outer quotes if present
   * - unescape common sequences (\n, \")
   * - remove code fences to leave raw markdown
   */
  function cleanModelText(raw: string): string {
    if (!raw) return "";
    let t = raw.trim();

    if (t.startsWith('"') && t.endsWith('"')) {
      t = t.slice(1, -1);
    }

    t = t
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");

    // Remove code fences but keep inner markdown
    t = t.replace(/^\s*```(?:md|markdown)?\s*/i, "").replace(/\s*```\s*$/i, "");

    return t.trim();
  }

  /**
   * Try parse JSON if model accidentally returned JSON-like content.
   * Returns parsed object or null.
   */
  function tryParseJsonFromText(text: string): ParsedRoutes | null {
    if (!text) return null;
    let attempt = text.trim();

    // remove fences
    attempt = attempt.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");

    if (attempt.startsWith('"') && attempt.endsWith('"')) attempt = attempt.slice(1, -1);

    // direct parse
    try {
      const parsed = JSON.parse(attempt);
      return parsed as ParsedRoutes;
    } catch {
      // unescape and try again
      const unescaped = attempt
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"');
      try {
        const parsed2 = JSON.parse(unescaped);
        return parsed2 as ParsedRoutes;
      } catch {
        const braceMatch = unescaped.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          try {
            return JSON.parse(braceMatch[0]) as ParsedRoutes;
          } catch {
            return null;
          }
        }
        return null;
      }
    }
  }

  /**
   * Primary action: call Gemini, extract and clean text, then:
   * - if JSON-like structure detected, render parsed routes
   * - otherwise render Markdown cleaned text via Markdown renderer
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

    const prompt = buildPromptMarkdown(city.trim(), Number(days.toFixed(0)));

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
              responseMimeType: "text/plain", // allowed mime type; model can still return Markdown
            },
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      const intineraryText = data.candidates[0].content.parts[0].text
      // console.log(data.candidates[0].content.parts[0].text);
      // extract and clean textual reply
      const rawText = extractTextFromResponse(intineraryText);
      const cleaned = cleanModelText(rawText);

      // If the model accidentally returned a JSON, prefer to parse and render structured routes.
      const parsed = tryParseJsonFromText(cleaned);
      if (parsed && parsed.routes && parsed.routes.length > 0) {
        setRoutesParsed(parsed);
        setTravel("");
      } else {
        // Render Markdown directly using markdown renderer
        setRoutesParsed(null);
        setTravel(cleaned);
      }
    } catch (err: any) {
      console.error("handleGenerate error:", err);
      setRoutesParsed(null);
      setTravel("Ocorreu um erro ao gerar o roteiro. Verifique a console para detalhes.");
      Alert.alert("Erro", String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Render parsed routes while keeping original layout.
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

      <ScrollView contentContainerStyle={{ paddingBottom: 24, marginTop: 4 }} style={styles.containerScroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.content}>
            <Text style={styles.title}>Carregando roteiro...</Text>
            <ActivityIndicator color="#000" size="large" />
          </View>
        )}

        {routesParsed ? (
          <RenderParsedRoutes parsed={routesParsed} />
        ) : null}

        {!routesParsed && travel ? (
          <View style={styles.content}>
            <Text style={styles.title}>Roteiro da viagem 👇</Text>

            {/* Render Markdown content (cleaned). Keeps visual fidelity (bold, lists). */}
            <Markdown>
              {travel}
            </Markdown>
          </View>
        ) : null}
      </ScrollView>

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
