import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { Key } from './app.collection';
import { IndexService } from 'src/index/index.service';
import { ImageInfo, ImageInfoDetails } from './app.dto';
import { firstValueFrom } from 'rxjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  index: number = 0;
  api_key: string = '';
  headers: any = {};
  genAi: GoogleGenerativeAI;
  constructor(
    private httpService: HttpService,
    private keyService: Key,
    private indexService: IndexService,
    private configService: ConfigService,
  ) { }
  async getImageInfo(data: ImageInfo) {
    if (!data) throw new HttpException('Invalid data', 400);
    try {
      this.index = await this.indexService.getIndex();
      this.api_key = this.keyService.Api_key_Array[this.index];
      if (!this.api_key) {
        throw new HttpException('Invalid API Key Index', 400);
      }
      this.headers = {
        'Api-Key': this.api_key,
        'Content-Type': 'application/json',
      };
      const url1 = 'https://insect.kindwise.com/api/v1/usage_info';
      const check = await firstValueFrom(
        this.httpService.get(url1, { headers: this.headers }),
      );
      if (check.data.remaining.total <= 0) {
        this.index = await this.indexService.updateIndexByPlusOne();
        this.api_key = this.keyService.Api_key_Array[this.index];
        this.headers = {
          'Api-Key': this.api_key,
          'Content-Type': 'application/json',
        };
      }
      const params = {
        details:
          'common_names,url,taxonomy,rank,description,image,images,role,inaturalist_id',
        language: 'en',
      };
      const url2 = `https://insect.kindwise.com/api/v1/identification?details=${params.details}&language=${params.language}`;
      const payload = {
        images: [data.images[0]],
        similar_images: true,
      };
      const res = await firstValueFrom(
        this.httpService.post(url2, payload, { headers: this.headers }),
      );
      if (res.data.result.is_insect.probability <= 0.3) {
        throw new HttpException('This picture is not an insect', 400);
      }
      return res.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error fetching image info:', error.message || error);
      throw new HttpException('Failed to fetch image info', 500);
    }
  }

  async getImageInfoDetails(data: ImageInfoDetails) {
    if (Object.keys(data.suggestion).length === 0) {
      return "Success";
    }
    try {
      const gemini_key = this.configService.get('GEMINI_KEY');
      this.genAi = new GoogleGenerativeAI(gemini_key);
      const model = this.genAi.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      const formattedData = {
        details: {
          name: data.suggestion.name,
          common_names: data.suggestion.details?.common_names || [],
          taxonomy: data.suggestion.details?.taxonomy || {},
        },
      };
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      };
      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              {text: "You will be given ONLY an json infomation about an insect contain like following:\n\"details\": {\n\"name\": \"Papilio troilus\",\n\"common_names\": [\n\"Spicebush swallowtail\"\n],\n\"taxonomy\": {\n\"class\": \"Insecta\",\n\"genus\": \"Papilio\",\n\"order\": \"Lepidoptera\",\n\"family\": \"Papilionidae\",\n\"phylum\": \"Arthropoda\",\n\"kingdom\": \"Animalia\"\n},\n}\nYour task to provide more infomation in JSON contain following:\nLife Cycle (with appearance)(create multiple object in JSON)\nHost Plants()(array in JSON)\nRange (Location) (string in JSON)\nHarm for agriculture(string in JSON)\nDetail about Effective Control Methods (for agriculture) (create multiple object in JSON)\ndanger_description(for hunam heatlh)(string in JSON)"},
            ],
          },
          {
            role: "model",
            parts: [
              {text: "```json\n{\n  \"details\": {\n    \"name\": \"Papilio troilus\",\n    \"common_names\": [\n      \"Spicebush swallowtail\"\n    ],\n    \"taxonomy\": {\n      \"class\": \"Insecta\",\n      \"genus\": \"Papilio\",\n      \"order\": \"Lepidoptera\",\n      \"family\": \"Papilionidae\",\n      \"phylum\": \"Arthropoda\",\n      \"kingdom\": \"Animalia\"\n    },\n    \"life_cycle\": [\n      {\n        \"stage\": \"Egg\",\n        \"appearance\": \"Small, round, pale yellow or greenish eggs laid singly on host plant leaves.\"\n      },\n      {\n        \"stage\": \"Larva (Caterpillar)\",\n        \"appearance\": \"Initially dark brown; later develops a green body with a saddle-like marking and yellow/orange eyespots.\"\n      },\n      {\n        \"stage\": \"Pupa (Chrysalis)\",\n        \"appearance\": \"Brownish-green chrysalis, often found attached to twigs or leaves, with a cryptic coloration that allows for camouflage.\"\n      },\n      {\n        \"stage\": \"Adult (Butterfly)\",\n        \"appearance\": \"Large butterfly with black wings, accented with iridescent blue and yellow markings.  Males have a wider blue area than females.\"\n      }\n    ],\n    \"host_plants\": [\n      \"Spicebush (Lindera benzoin)\",\n      \"Sassafras (Sassafras albidum)\",\n      \"Redbay (Persea borbonia)\"\n    ],\n    \"range\": \"Eastern North America, from southern Canada to Florida and Texas.\",\n    \"harm_for_agriculture\": \"Generally considered non-harmful to agriculture; the larval stage may consume leaves of host plants, but rarely in quantities significant enough to cause economic damage.\",\n    \"effective_control_methods\": [\n      {\n        \"method\": \"Natural Predators\",\n        \"description\": \"Many parasitoids and predators naturally control populations, reducing the need for intervention.\"\n      },\n      {\n        \"method\": \"Handpicking\",\n        \"description\": \"Larvae can be manually removed from host plants in small gardens or nurseries.\"\n      },\n      {\n        \"method\": \"Bacillus thuringiensis (Bt)\",\n        \"description\": \"In cases of significant infestation, a Bt-based insecticide can be employed but is generally not necessary.\"\n      }\n    ],\n    \"danger_description\": \"Spicebush swallowtails pose no direct danger to human health.  They are not venomous or aggressive.  Contact with their larvae might cause mild skin irritation in sensitive individuals, similar to other caterpillars.\"\n  }\n}\n```\n"},
            ],
          },
        ],
      });
      const result = await chatSession.sendMessage(
        JSON.stringify(formattedData, null, 2),
      );
      if (!result) throw new HttpException('Error sending message', 400);
      return {
        data: JSON.parse(result.response.text()),
        description: data.suggestion.details.description.value,
        url: data.suggestion.details.url,
        image: data.suggestion.details.image?.value,
        images: data.suggestion.details?.images?.map(image => image.value),
        role: data.suggestion.details?.role
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error fetching image info:', error.message || error);
      throw new HttpException('Failed to get info from Gemini', 500);
    }
  }
}
