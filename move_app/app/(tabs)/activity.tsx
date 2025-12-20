
import { View, Text } from "react-native";
import React from "react";
import Container from "@/components/Container";
import Title from "@/components/Title";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import tw from "twrnc";

const Activity = () => {
  return (
    <Container style={tw`bg-[#23272F] flex-1`}>
      <Title>Activity</Title>
      <View style={tw`py-3 flex-row items-center justify-between mb-2`}>
        <View style={tw`w-10 h-10 rounded-full bg-[#35736E] items-center justify-center`}>
          <TabBarIcon name="options" size={20} color={"white"} />
        </View>
        <Title className="text-xl text-[#FFA726]">Past</Title>
      </View>
      <View style={tw`bg-[#2D313A] rounded-2xl px-6 py-10 items-center justify-center shadow-md mt-4 mb-6`}>
        <TabBarIcon name="document" size={40} color="#5EC6C6" />
        <Text style={tw`text-lg font-semibold text-white mt-4 mb-1`}>No Activities Yet</Text>
        <Text style={tw`text-base text-gray-300 text-center`}>You don't have any recent activities</Text>
      </View>
    </Container>
  );
};

export default Activity;
