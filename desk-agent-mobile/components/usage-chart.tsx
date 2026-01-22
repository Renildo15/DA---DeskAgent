import { View, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

type Props = {
  data: number[];
};

export function UsageChart({ data }: Props) {
  if (data.length < 2) return null;

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          datasets: [{ data }],
        }}
        width={screenWidth - 32} // Ajuste conforme seu layout
        height={220}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#1976D2",
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
});