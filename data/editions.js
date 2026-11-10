/* 유형별 마리오 세대. cast 순서 = 하·중·상.
   animation은 원작 프레임 자료이며 출처·추출 방법은 assets/monsters/original-sources.json에 기록합니다.
   facing: right인 원본은 표시할 때 좌우 반전하여 구름이·노을이가 있는 왼쪽을 봅니다.
   무음 배경 전투는 문제 창 아래에서만 진행하며 사용자의 타이머·정답 조작이 우선합니다. */
window.QUIZ_EDITIONS = {
  "smb1": {
    "name": "슈퍼 마리오브라더스",
    "cast": [
      [
        {
          "name": "Little Goomba",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/01 - Little Goomba.png",
          "width": 16,
          "height": 16,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb1/SMB_Goomba_Sprite.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        },
        {
          "name": "Koopa Troopa (green)",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/02 - Koopa Troopa (green).png",
          "width": 16,
          "height": 23,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb1/Green_Koopa_Troopa_SMB.gif",
            "width": 16,
            "height": 24,
            "frames": 2
          }
        },
        {
          "name": "Koopa Troopa (red)",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/03 - Koopa Troopa (red).png",
          "width": 16,
          "height": 23,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb1/SMB_Red_Koopa_Troopa.gif",
            "width": 16,
            "height": 24,
            "frames": 2
          }
        }
      ],
      [
        {
          "name": "Koopa Paratroopa (green)",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/04 - Koopa Paratroopa (green).png",
          "width": 16,
          "height": 23,
          "motion": "fly",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb1/SMB_Green_Koopa_Paratroopa_Sprite.gif",
            "width": 16,
            "height": 24,
            "frames": 2
          }
        },
        {
          "name": "Hammer Brother",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/07 - Hammer Brother.png",
          "width": 16,
          "height": 24,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb1/SMB_Hammer_Bro_Throwing_Hammer_Sprite.gif",
            "width": 28,
            "height": 40,
            "frames": 5
          }
        },
        {
          "name": "Bullet Bill",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/14 - Bullet Bill.png",
          "width": 16,
          "height": 14,
          "motion": "projectile",
          "boss": false,
          "animationNote": "Original single-frame sprite; movement is positional."
        }
      ],
      [
        {
          "name": "Hammer Brother",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/07 - Hammer Brother.png",
          "width": 16,
          "height": 24,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb1/SMB_Hammer_Bro_Throwing_Hammer_Sprite.gif",
            "width": 28,
            "height": 40,
            "frames": 5
          }
        },
        {
          "name": "Bowser",
          "path": "캐릭터 이미지/01_Super Mario Bros/02_보스 몬스터/01 - Bowser.png",
          "width": 32,
          "height": 32,
          "motion": "boss",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smb1/SMB_Bowser_Walking_Sprite.gif",
            "width": 32,
            "height": 32,
            "frames": 2
          }
        },
        {
          "name": "Podoboo",
          "path": "캐릭터 이미지/01_Super Mario Bros/01_일반 몬스터/16 - Podoboo.png",
          "width": 14,
          "height": 16,
          "motion": "hop",
          "boss": false,
          "animationNote": "Original single-frame sprite; movement is positional."
        }
      ]
    ]
  },
  "smb3": {
    "name": "슈퍼 마리오브라더스 3",
    "cast": [
      [
        {
          "name": "Cheep-Cheep",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/01_일반 몬스터/46 - Cheep-Cheep.png",
          "width": 16,
          "height": 16,
          "motion": "swim",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_Baby_Cheep_swim_land.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        },
        {
          "name": "Green Cheep-Cheep",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/01_일반 몬스터/47 - Green Cheep-Cheep.png",
          "width": 16,
          "height": 16,
          "motion": "swim",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_Cheep-Cheep_green_swim_land.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        },
        {
          "name": "Green Koopa Troopa",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/01_일반 몬스터/08 - Green Koopa Troopa.png",
          "width": 16,
          "height": 32,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb3/Green_Koopa_SMB3.gif",
            "width": 16,
            "height": 33,
            "frames": 2
          }
        }
      ],
      [
        {
          "name": "Spiny Cheep-Cheep",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/01_일반 몬스터/50 - Spiny Cheep-Cheep.png",
          "width": 16,
          "height": 16,
          "motion": "swim",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_Spiny_Cheep-Cheep_swim_land.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        },
        {
          "name": "Green Koopa Paratroopa",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/01_일반 몬스터/10 - Green Koopa Paratroopa.png",
          "width": 16,
          "height": 32,
          "motion": "fly",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_KoopaParatroopaGreenL.gif",
            "width": 16,
            "height": 33,
            "frames": 6
          }
        },
        {
          "name": "\"Boo\" Diddly",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/01_일반 몬스터/51 - -Boo- Diddly.png",
          "width": 16,
          "height": 16,
          "motion": "ghost",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_'Boo'_Diddly_fort.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        }
      ],
      [
        {
          "name": "Boom Boom",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/02_보스 몬스터/01 - Boom Boom.png",
          "width": 32,
          "height": 24,
          "motion": "boss",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_Boom_Boom_fort_light_panic.gif",
            "width": 32,
            "height": 32,
            "frames": 6
          }
        },
        {
          "name": "Bowser",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/02_보스 몬스터/09 - Bowser.png",
          "width": 32,
          "height": 40,
          "motion": "boss",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_Bowser_breath.gif",
            "width": 32,
            "height": 40,
            "frames": 5
          }
        },
        {
          "name": "Ludwig von Koopa",
          "path": "캐릭터 이미지/02_Super Mario Bros 3/02_보스 몬스터/08 - Ludwig von Koopa.png",
          "width": 35,
          "height": 32,
          "motion": "boss",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smb3/SMB3_Ludwig_wandless_walk.gif",
            "width": 24,
            "height": 32,
            "frames": 2
          }
        }
      ]
    ]
  },
  "nsmb": {
    "name": "뉴 슈퍼 마리오브라더스 DS",
    "cast": [
      [
        {
          "name": "Paragoomba",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/01_일반 몬스터/02 - Paragoomba.png",
          "width": 23,
          "height": 28,
          "motion": "fly",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/nsmb/paragoomba.webp",
            "width": 35,
            "height": 29,
            "frames": 11
          }
        },
        {
          "name": "Koopa Paratroopa (Green)",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/01_일반 몬스터/07 - Koopa Paratroopa (Green).png",
          "width": 19,
          "height": 31,
          "motion": "fly",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/nsmb/koopa-paratroopa-green.webp",
            "width": 32,
            "height": 32,
            "frames": 11
          }
        },
        {
          "name": "Goomba",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/01_일반 몬스터/01 - Goomba.png",
          "width": 16,
          "height": 18,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/nsmb/NSMBDS_Goomba_Walking_Sprite.gif",
            "width": 18,
            "height": 19,
            "frames": 8
          }
        }
      ],
      [
        {
          "name": "Koopa Paratroopa (Red)",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/01_일반 몬스터/08 - Koopa Paratroopa (Red).png",
          "width": 19,
          "height": 30,
          "motion": "fly",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/nsmb/koopa-paratroopa-red.webp",
            "width": 32,
            "height": 32,
            "frames": 11
          }
        },
        {
          "name": "Bullet Bill",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/01_일반 몬스터/61 - Bullet Bill.png",
          "width": 21,
          "height": 13,
          "motion": "projectile",
          "boss": false,
          "animationNote": "Original single-frame sprite; movement is positional."
        },
        {
          "name": "Boo",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/01_일반 몬스터/47 - Boo.gif",
          "width": 24,
          "height": 20,
          "motion": "ghost",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/nsmb/NSMBDS_Boo_Sprite.gif",
            "width": 24,
            "height": 20,
            "frames": 4
          }
        }
      ],
      [
        {
          "name": "Bowser Jr.",
          "facing": "right",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/02_보스 몬스터/01 - Bowser Jr.png",
          "width": 32,
          "height": 41,
          "motion": "boss",
          "boss": true,
          "animationNote": "Original reference sprite only; no verified animation frames available."
        },
        {
          "name": "Bowser",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/02_보스 몬스터/03 - Bowser.png",
          "width": 71,
          "height": 59,
          "motion": "boss",
          "boss": true,
          "animationNote": "Original reference sprite only; no verified animation frames available."
        },
        {
          "name": "Dry Bowser",
          "path": "캐릭터 이미지/03_New Super Mario Bros DS/02_보스 몬스터/10 - Dry Bowser.png",
          "width": 77,
          "height": 56,
          "motion": "boss",
          "boss": true,
          "animationNote": "Original reference sprite only; no verified animation frames available."
        }
      ]
    ]
  },
  "smw": {
    "name": "슈퍼 마리오 월드",
    "cast": [
      [
        {
          "name": "Goomba",
          "path": "캐릭터 이미지/04_Super Mario World/02_일반 몬스터/01 - Goomba.png",
          "width": 16,
          "height": 15,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smw/SMW_Goomba_Sprite.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        },
        {
          "name": "Koopa (Green)",
          "path": "캐릭터 이미지/04_Super Mario World/02_일반 몬스터/27 - Koopa (Green).png",
          "width": 16,
          "height": 26,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smw/KoopaGreenL.gif",
            "width": 16,
            "height": 27,
            "frames": 2
          }
        },
        {
          "name": "Monty Mole",
          "path": "캐릭터 이미지/04_Super Mario World/02_일반 몬스터/20 - Monty Mole.png",
          "width": 16,
          "height": 15,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smw/MontyMoleL.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        }
      ],
      [
        {
          "name": "Dry Bones",
          "path": "캐릭터 이미지/04_Super Mario World/02_일반 몬스터/73 - Dry Bones.png",
          "width": 24,
          "height": 32,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smw/DryBonesL.gif",
            "width": 24,
            "height": 32,
            "frames": 2
          }
        },
        {
          "name": "Magikoopa",
          "path": "캐릭터 이미지/04_Super Mario World/02_일반 몬스터/81 - Magikoopa.png",
          "width": 24,
          "height": 32,
          "motion": "walk",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smw/magikoopa-cast.webp",
            "width": 30,
            "height": 33,
            "frames": 18
          }
        },
        {
          "name": "Boo Buddy",
          "facing": "right",
          "path": "캐릭터 이미지/04_Super Mario World/02_일반 몬스터/65 - Boo Buddy.png",
          "width": 16,
          "height": 16,
          "motion": "ghost",
          "boss": false,
          "animation": {
            "path": "assets/monsters/original/smw/Boo_buddy.gif",
            "width": 16,
            "height": 16,
            "frames": 2
          }
        }
      ],
      [
        {
          "name": "Iggy Koopa",
          "path": "캐릭터 이미지/04_Super Mario World/03_보스 몬스터/03 - Iggy Koopa.png",
          "width": 24,
          "height": 30,
          "motion": "boss",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smw/SMW_IggyWalking.gif",
            "width": 25,
            "height": 30,
            "frames": 16
          }
        },
        {
          "name": "Bowser",
          "path": "캐릭터 이미지/04_Super Mario World/03_보스 몬스터/10 - Bowser.png",
          "width": 64,
          "height": 96,
          "motion": "hover",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smw/SMW-Bowser_in_Koopa_Clown_Car.gif",
            "width": 64,
            "height": 96,
            "frames": 4
          }
        },
        {
          "name": "Ludwig von Koopa",
          "path": "캐릭터 이미지/04_Super Mario World/03_보스 몬스터/06 - Ludwig von Koopa.png",
          "width": 22,
          "height": 32,
          "motion": "boss",
          "boss": true,
          "animation": {
            "path": "assets/monsters/original/smw/SMW_Ludwig_spin.gif",
            "width": 20,
            "height": 18,
            "referenceHeight": 18,
            "frames": 4
          }
        }
      ]
    ]
  }
};
