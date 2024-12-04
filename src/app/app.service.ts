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
  ) {}
  async getImageInfo(data: ImageInfo) {
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
          'common_names,url,taxonomy,rank,description,images,danger_description,role,inaturalist_id',
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
            role: 'user',
            parts: [
              {
                text: 'You will be given ONLY an json infomation about an insect contain like following:\n"details": {\n"name": "Papilio troilus",                    \n                    "common_names": [\n                        "Spicebush swallowtail"\n                    ],\n                    "taxonomy": {\n                        "class": "Insecta",\n                        "genus": "Papilio",\n                        "order": "Lepidoptera",\n                        "family": "Papilionidae",\n                        "phylum": "Arthropoda",\n                        "kingdom": "Animalia"\n                    },\n        }\nYour task to provide more infomation in JSON contain following:\n- Life Cycle (with appearance)(create multiple object in JSON)\n- Host Plants()(array in JSON)\n- Range (Location) (string in JSON)\n- Detail about Effective Control Methods (for agriculture) (create multiple object in JSON)',
              },
            ],
          },
          {
            role: 'model',
            parts: [
              {
                text: '```json\n{\n  "details": {\n    "name": "Papilio troilus",\n    "common_names": [\n      "Spicebush swallowtail"\n    ],\n    "taxonomy": {\n      "class": "Insecta",\n      "genus": "Papilio",\n      "order": "Lepidoptera",\n      "family": "Papilionidae",\n      "phylum": "Arthropoda",\n      "kingdom": "Animalia"\n    },\n    "life_cycle": [\n      {\n        "stage": "Egg",\n        "appearance": "Small, pale yellow or greenish-white, spherical eggs laid singly on host plant leaves."\n      },\n      {\n        "stage": "Larva (Caterpillar)",\n        "appearance": "Initially, dark brown with a white saddle. Later instars develop  a green body with a distinctive yellow eyespot on each side of the thorax.  They have a forked osmeterium (orange gland) that they extend when threatened."\n      },\n      {\n        "stage": "Pupa (Chrysalis)",\n        "appearance": "Brownish-green or grey pupa, often with a camouflage pattern that blends in with its surroundings.  It hangs suspended from a twig or leaf."\n      },\n      {\n        "stage": "Adult (Butterfly)",\n        "appearance": "Large butterfly with black wings, bordered with yellow.  Hindwings have iridescent blue-green spots near the margin and a pair of tails.  Females are generally larger than males."\n      }\n    ],\n    "host_plants": [\n      "Lindera benzoin (Spicebush)",\n      "Sassafras albidum (Sassafras)",\n      "Litsea aeborina (Red bay)"\n\n    ],\n    "range": "Eastern North America, from southern Canada to Florida and Texas.",\n    "effective_control_methods": [\n      {\n        "method": "Biological Control",\n        "description": "Introducing natural predators such as parasitic wasps or flies that target the larvae. This is generally considered the most environmentally friendly approach."\n      },\n      {\n        "method": "Handpicking",\n        "description": "Manually removing caterpillars from host plants, especially effective in small gardens or nurseries.  Use caution as they have an irritating gland"\n      },\n      {\n        "method": "Bacillus thuringiensis (Bt)",\n        "description": "Applying a specific type of Bt (Bt kurstaki) that targets lepidopteran larvae. This is a bacterial insecticide that is relatively safe for other insects and the environment."\n      },\n      {\n        "method": "Neem Oil",\n        "description": "Using neem oil, a natural insecticide derived from the neem tree, can disrupt the feeding and development of caterpillars."\n      }\n    ]\n  }\n}\n```\n',
              },
            ],
          },
        ],
      });
      const result = await chatSession.sendMessage(
        JSON.stringify(formattedData, null, 2),
      );
      if (!result) throw new HttpException('Error sending message', 400);
      return JSON.parse(result.response.text());
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error fetching image info:', error.message || error);
      throw new HttpException('Failed to get info from Gemini', 500);
    }
  }
}
