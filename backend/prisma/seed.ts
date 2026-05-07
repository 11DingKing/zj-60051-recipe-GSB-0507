import { PrismaClient, Role, Difficulty, RecipeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const categoriesData = [
    { name: '川菜', icon: '🌶️', sortOrder: 1 },
    { name: '粤菜', icon: '🥟', sortOrder: 2 },
    { name: '湘菜', icon: '🍖', sortOrder: 3 },
    { name: '西餐', icon: '🍝', sortOrder: 4 },
    { name: '日料', icon: '🍣', sortOrder: 5 },
    { name: '烘焙', icon: '🍰', sortOrder: 6 },
    { name: '家常菜', icon: '🍳', sortOrder: 7 },
    { name: '甜点', icon: '🧁', sortOrder: 8 },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
    categories.push(category);
  }

  const [admin, user1, user2] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@recipe.com',
        password: hashedPassword,
        nickname: '管理员',
        avatar: 'https://picsum.photos/200/200?random=1',
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { username: 'cook_master' },
      update: {},
      create: {
        username: 'cook_master',
        email: 'cook@recipe.com',
        password: hashedPassword,
        nickname: '厨艺大师',
        avatar: 'https://picsum.photos/200/200?random=2',
        role: Role.USER,
      },
    }),
    prisma.user.upsert({
      where: { username: 'food_lover' },
      update: {},
      create: {
        username: 'food_lover',
        email: 'food@recipe.com',
        password: hashedPassword,
        nickname: '美食爱好者',
        avatar: 'https://picsum.photos/200/200?random=3',
        role: Role.USER,
      },
    }),
  ]);

  const recipesData = [
    {
      title: '麻婆豆腐',
      coverImage: 'https://picsum.photos/400/300?random=10',
      cookTime: 25,
      difficulty: Difficulty.MEDIUM,
      servings: 2,
      status: RecipeStatus.PUBLISHED,
      viewCount: 1250,
      likeCount: 89,
      favoriteCount: 45,
      commentCount: 12,
      categoryName: '川菜',
      ingredients: [
        { name: '嫩豆腐', amount: '400g' },
        { name: '牛肉末', amount: '100g' },
        { name: '郫县豆瓣酱', amount: '2勺' },
        { name: '花椒粉', amount: '1勺' },
        { name: '葱姜蒜', amount: '适量' },
      ],
      steps: [
        { description: '豆腐切成2厘米见方的小块，放入加盐的开水中焯烫2分钟，捞出沥干', stepNumber: 1, image: 'https://picsum.photos/600/400?random=101' },
        { description: '锅中放油，下入牛肉末炒至变色', stepNumber: 2, image: 'https://picsum.photos/600/400?random=102' },
        { description: '加入郫县豆瓣酱炒出红油', stepNumber: 3, image: 'https://picsum.photos/600/400?random=103' },
        { description: '加入适量清水，放入豆腐块，中火煮5分钟', stepNumber: 4, image: 'https://picsum.photos/600/400?random=104' },
        { description: '勾芡，撒上花椒粉和葱花即可出锅', stepNumber: 5, image: 'https://picsum.photos/600/400?random=105' },
      ],
    },
    {
      title: '宫保鸡丁',
      coverImage: 'https://picsum.photos/400/300?random=11',
      cookTime: 30,
      difficulty: Difficulty.MEDIUM,
      servings: 3,
      status: RecipeStatus.PUBLISHED,
      viewCount: 980,
      likeCount: 72,
      favoriteCount: 38,
      commentCount: 8,
      categoryName: '川菜',
      ingredients: [
        { name: '鸡胸肉', amount: '300g' },
        { name: '花生米', amount: '50g' },
        { name: '干辣椒', amount: '10个' },
        { name: '花椒', amount: '1勺' },
        { name: '葱姜蒜', amount: '适量' },
        { name: '生抽老抽', amount: '各1勺' },
      ],
      steps: [
        { description: '鸡胸肉切丁，用料酒、生抽、淀粉腌制15分钟', stepNumber: 1, image: 'https://picsum.photos/600/400?random=111' },
        { description: '调酱汁：生抽、老抽、醋、糖、淀粉、水', stepNumber: 2, image: 'https://picsum.photos/600/400?random=112' },
        { description: '花生米炸至金黄捞出', stepNumber: 3, image: 'https://picsum.photos/600/400?random=113' },
        { description: '锅中放油，爆香干辣椒和花椒', stepNumber: 4, image: 'https://picsum.photos/600/400?random=114' },
        { description: '下入鸡丁快速翻炒至变色', stepNumber: 5, image: 'https://picsum.photos/600/400?random=115' },
        { description: '倒入酱汁翻炒均匀，最后加入花生米即可', stepNumber: 6, image: 'https://picsum.photos/600/400?random=116' },
      ],
    },
    {
      title: '白切鸡',
      coverImage: 'https://picsum.photos/400/300?random=12',
      cookTime: 45,
      difficulty: Difficulty.EASY,
      servings: 4,
      status: RecipeStatus.PUBLISHED,
      viewCount: 850,
      likeCount: 65,
      favoriteCount: 32,
      commentCount: 10,
      categoryName: '粤菜',
      ingredients: [
        { name: '三黄鸡', amount: '1只(约1.5kg)' },
        { name: '姜', amount: '50g' },
        { name: '葱', amount: '3根' },
        { name: '料酒', amount: '2勺' },
        { name: '盐', amount: '适量' },
        { name: '冰水', amount: '适量' },
      ],
      steps: [
        { description: '三黄鸡清洗干净，锅中加水放入姜片、葱段、料酒', stepNumber: 1, image: 'https://picsum.photos/600/400?random=121' },
        { description: '水开后放入鸡，反复提起几次让腔内受热均匀', stepNumber: 2, image: 'https://picsum.photos/600/400?random=122' },
        { description: '小火浸煮25分钟，期间翻转几次', stepNumber: 3, image: 'https://picsum.photos/600/400?random=123' },
        { description: '捞出立即放入冰水中浸泡20分钟', stepNumber: 4, image: 'https://picsum.photos/600/400?random=124' },
        { description: '捞出沥干，斩块装盘，配上姜葱蘸料即可', stepNumber: 5, image: 'https://picsum.photos/600/400?random=125' },
      ],
    },
    {
      title: '虾饺皇',
      coverImage: 'https://picsum.photos/400/300?random=13',
      cookTime: 60,
      difficulty: Difficulty.HARD,
      servings: 4,
      status: RecipeStatus.PUBLISHED,
      viewCount: 720,
      likeCount: 58,
      favoriteCount: 42,
      commentCount: 6,
      categoryName: '粤菜',
      ingredients: [
        { name: '澄粉', amount: '200g' },
        { name: '木薯淀粉', amount: '50g' },
        { name: '鲜虾', amount: '300g' },
        { name: '肥猪肉', amount: '50g' },
        { name: '笋丁', amount: '50g' },
        { name: '猪油', amount: '20g' },
      ],
      steps: [
        { description: '澄粉和木薯淀粉混合，冲入沸水搅拌成雪花状', stepNumber: 1, image: 'https://picsum.photos/600/400?random=131' },
        { description: '稍凉后揉成光滑面团，加入猪油揉匀，醒发20分钟', stepNumber: 2, image: 'https://picsum.photos/600/400?random=132' },
        { description: '虾去壳去线，一部分剁泥，一部分切大粒，肥猪肉和笋丁切碎', stepNumber: 3, image: 'https://picsum.photos/600/400?random=133' },
        { description: '馅料中加入盐、糖、生抽、香油、胡椒粉，顺时针搅拌上劲', stepNumber: 4, image: 'https://picsum.photos/600/400?random=134' },
        { description: '面团分成小剂子，擀成薄圆片，包入馅料，捏成饺子形', stepNumber: 5, image: 'https://picsum.photos/600/400?random=135' },
        { description: '水开后放入蒸笼，大火蒸5-6分钟即可', stepNumber: 6, image: 'https://picsum.photos/600/400?random=136' },
      ],
    },
    {
      title: '剁椒鱼头',
      coverImage: 'https://picsum.photos/400/300?random=14',
      cookTime: 40,
      difficulty: Difficulty.MEDIUM,
      servings: 4,
      status: RecipeStatus.PUBLISHED,
      viewCount: 1100,
      likeCount: 85,
      favoriteCount: 50,
      commentCount: 15,
      categoryName: '湘菜',
      ingredients: [
        { name: '胖头鱼头', amount: '1个(约1.5kg)' },
        { name: '剁椒', amount: '200g' },
        { name: '泡椒', amount: '50g' },
        { name: '姜蒜', amount: '适量' },
        { name: '料酒', amount: '3勺' },
        { name: '葱花', amount: '适量' },
      ],
      steps: [
        { description: '鱼头洗净，从背部剖开，用盐、料酒腌制15分钟', stepNumber: 1, image: 'https://picsum.photos/600/400?random=141' },
        { description: '剁椒和泡椒切碎，姜蒜切末', stepNumber: 2, image: 'https://picsum.photos/600/400?random=142' },
        { description: '锅中放油，爆香姜蒜，加入剁椒炒出香味', stepNumber: 3, image: 'https://picsum.photos/600/400?random=143' },
        { description: '鱼头摆盘，铺上炒好的剁椒', stepNumber: 4, image: 'https://picsum.photos/600/400?random=144' },
        { description: '水开后放入蒸笼，大火蒸15分钟', stepNumber: 5, image: 'https://picsum.photos/600/400?random=145' },
        { description: '取出撒上葱花，淋上热油即可', stepNumber: 6, image: 'https://picsum.photos/600/400?random=146' },
      ],
    },
    {
      title: '意大利面',
      coverImage: 'https://picsum.photos/400/300?random=15',
      cookTime: 30,
      difficulty: Difficulty.EASY,
      servings: 2,
      status: RecipeStatus.PUBLISHED,
      viewCount: 950,
      likeCount: 78,
      favoriteCount: 45,
      commentCount: 9,
      categoryName: '西餐',
      ingredients: [
        { name: '意大利面', amount: '200g' },
        { name: '培根', amount: '100g' },
        { name: '蒜末', amount: '2勺' },
        { name: '橄榄油', amount: '3勺' },
        { name: '帕玛森芝士', amount: '30g' },
        { name: '黑胡椒', amount: '适量' },
      ],
      steps: [
        { description: '锅中加水加盐，按包装说明煮意面至八分熟', stepNumber: 1, image: 'https://picsum.photos/600/400?random=151' },
        { description: '培根切条，锅中放少许油，煎至金黄', stepNumber: 2, image: 'https://picsum.photos/600/400?random=152' },
        { description: '加入蒜末爆香', stepNumber: 3, image: 'https://picsum.photos/600/400?random=153' },
        { description: '将煮好的意面捞出，加入锅中，加少许面汤', stepNumber: 4, image: 'https://picsum.photos/600/400?random=154' },
        { description: '翻炒均匀，撒上芝士和黑胡椒即可', stepNumber: 5, image: 'https://picsum.photos/600/400?random=155' },
      ],
    },
    {
      title: '牛排',
      coverImage: 'https://picsum.photos/400/300?random=16',
      cookTime: 20,
      difficulty: Difficulty.MEDIUM,
      servings: 1,
      status: RecipeStatus.PUBLISHED,
      viewCount: 880,
      likeCount: 62,
      favoriteCount: 38,
      commentCount: 7,
      categoryName: '西餐',
      ingredients: [
        { name: '西冷牛排', amount: '200g' },
        { name: '海盐', amount: '适量' },
        { name: '黑胡椒', amount: '适量' },
        { name: '黄油', amount: '20g' },
        { name: '大蒜', amount: '3瓣' },
        { name: '迷迭香', amount: '2枝' },
      ],
      steps: [
        { description: '牛排提前从冰箱取出，室温放置30分钟，用厨房纸吸干表面水分', stepNumber: 1, image: 'https://picsum.photos/600/400?random=161' },
        { description: '两面均匀撒上海盐和黑胡椒', stepNumber: 2, image: 'https://picsum.photos/600/400?random=162' },
        { description: '铸铁锅烧热至冒烟，放入牛排，不要移动', stepNumber: 3, image: 'https://picsum.photos/600/400?random=163' },
        { description: '每面煎2-3分钟（根据厚度和喜欢的熟度调整）', stepNumber: 4, image: 'https://picsum.photos/600/400?random=164' },
        { description: '加入黄油、大蒜、迷迭香，用勺子将黄油淋在牛排上', stepNumber: 5, image: 'https://picsum.photos/600/400?random=165' },
        { description: '取出静置5分钟，让肉汁重新分布', stepNumber: 6, image: 'https://picsum.photos/600/400?random=166' },
      ],
    },
    {
      title: '三文鱼刺身',
      coverImage: 'https://picsum.photos/400/300?random=17',
      cookTime: 15,
      difficulty: Difficulty.EASY,
      servings: 2,
      status: RecipeStatus.PUBLISHED,
      viewCount: 750,
      likeCount: 55,
      favoriteCount: 30,
      commentCount: 5,
      categoryName: '日料',
      ingredients: [
        { name: '新鲜三文鱼', amount: '300g' },
        { name: '山葵', amount: '适量' },
        { name: '酱油', amount: '适量' },
        { name: '冰块', amount: '适量' },
        { name: '紫苏叶', amount: '适量' },
      ],
      steps: [
        { description: '三文鱼放入冰箱冷冻2小时，便于切片', stepNumber: 1, image: 'https://picsum.photos/600/400?random=171' },
        { description: '取出三文鱼，用非常锋利的刀斜切成厚片', stepNumber: 2, image: 'https://picsum.photos/600/400?random=172' },
        { description: '盘中铺上冰块，放上紫苏叶', stepNumber: 3, image: 'https://picsum.photos/600/400?random=173' },
        { description: '将三文鱼片整齐摆放在紫苏叶上', stepNumber: 4, image: 'https://picsum.photos/600/400?random=174' },
        { description: '山葵磨成泥，配酱油蘸食', stepNumber: 5, image: 'https://picsum.photos/600/400?random=175' },
      ],
    },
    {
      title: '寿司卷',
      coverImage: 'https://picsum.photos/400/300?random=18',
      cookTime: 45,
      difficulty: Difficulty.MEDIUM,
      servings: 4,
      status: RecipeStatus.PUBLISHED,
      viewCount: 680,
      likeCount: 48,
      favoriteCount: 35,
      commentCount: 4,
      categoryName: '日料',
      ingredients: [
        { name: '寿司米', amount: '300g' },
        { name: '寿司醋', amount: '3勺' },
        { name: '海苔', amount: '3张' },
        { name: '黄瓜', amount: '1根' },
        { name: '牛油果', amount: '1个' },
        { name: '蟹肉棒', amount: '6根' },
      ],
      steps: [
        { description: '寿司米洗净，浸泡30分钟，煮熟', stepNumber: 1, image: 'https://picsum.photos/600/400?random=181' },
        { description: '趁热加入寿司醋，拌匀，放凉', stepNumber: 2, image: 'https://picsum.photos/600/400?random=182' },
        { description: '黄瓜、牛油果切条，蟹肉棒撕成丝', stepNumber: 3, image: 'https://picsum.photos/600/400?random=183' },
        { description: '寿司帘上铺海苔，粗糙面朝上，均匀铺上寿司饭', stepNumber: 4, image: 'https://picsum.photos/600/400?random=184' },
        { description: '在中间放上馅料，用寿司帘卷紧', stepNumber: 5, image: 'https://picsum.photos/600/400?random=185' },
        { description: '刀沾水，切成厚片即可', stepNumber: 6, image: 'https://picsum.photos/600/400?random=186' },
      ],
    },
    {
      title: '戚风蛋糕',
      coverImage: 'https://picsum.photos/400/300?random=19',
      cookTime: 70,
      difficulty: Difficulty.HARD,
      servings: 8,
      status: RecipeStatus.PUBLISHED,
      viewCount: 1200,
      likeCount: 95,
      favoriteCount: 70,
      commentCount: 18,
      categoryName: '烘焙',
      ingredients: [
        { name: '鸡蛋', amount: '5个' },
        { name: '低筋面粉', amount: '85g' },
        { name: '细砂糖', amount: '80g(蛋白)+30g(蛋黄)' },
        { name: '牛奶', amount: '50g' },
        { name: '玉米油', amount: '50g' },
        { name: '柠檬汁', amount: '几滴' },
      ],
      steps: [
        { description: '蛋白蛋黄分离，蛋白放入无油无水的盆中', stepNumber: 1, image: 'https://picsum.photos/600/400?random=191' },
        { description: '蛋黄中加入30g糖、牛奶、玉米油，搅拌均匀', stepNumber: 2, image: 'https://picsum.photos/600/400?random=192' },
        { description: '筛入低筋面粉，翻拌至无干粉', stepNumber: 3, image: 'https://picsum.photos/600/400?random=193' },
        { description: '蛋白加柠檬汁，分三次加入80g糖，打发至硬性发泡', stepNumber: 4, image: 'https://picsum.photos/600/400?random=194' },
        { description: '取1/3蛋白霜加入蛋黄糊，翻拌均匀，再倒回蛋白霜中，翻拌均匀', stepNumber: 5, image: 'https://picsum.photos/600/400?random=195' },
        { description: '倒入6寸模具，震出气泡，烤箱预热170度，烤45分钟', stepNumber: 6, image: 'https://picsum.photos/600/400?random=196' },
        { description: '取出立即倒扣，完全冷却后脱模', stepNumber: 7, image: 'https://picsum.photos/600/400?random=197' },
      ],
    },
    {
      title: '曲奇饼干',
      coverImage: 'https://picsum.photos/400/300?random=20',
      cookTime: 40,
      difficulty: Difficulty.EASY,
      servings: 20,
      status: RecipeStatus.PUBLISHED,
      viewCount: 900,
      likeCount: 70,
      favoriteCount: 55,
      commentCount: 11,
      categoryName: '烘焙',
      ingredients: [
        { name: '黄油', amount: '150g' },
        { name: '糖粉', amount: '60g' },
        { name: '低筋面粉', amount: '200g' },
        { name: '鸡蛋', amount: '1个' },
        { name: '香草精', amount: '1勺' },
        { name: '盐', amount: '少许' },
      ],
      steps: [
        { description: '黄油室温软化，加入糖粉和盐，打发至颜色变浅', stepNumber: 1, image: 'https://picsum.photos/600/400?random=201' },
        { description: '分次加入蛋液，每次打发均匀后再加下一次', stepNumber: 2, image: 'https://picsum.photos/600/400?random=202' },
        { description: '加入香草精，搅拌均匀', stepNumber: 3, image: 'https://picsum.photos/600/400?random=203' },
        { description: '筛入低筋面粉，用刮刀翻拌至无干粉', stepNumber: 4, image: 'https://picsum.photos/600/400?random=204' },
        { description: '装入裱花袋，用曲奇花嘴挤在烤盘上', stepNumber: 5, image: 'https://picsum.photos/600/400?random=205' },
        { description: '烤箱预热170度，烤15-18分钟至边缘金黄', stepNumber: 6, image: 'https://picsum.photos/600/400?random=206' },
      ],
    },
    {
      title: '番茄炒蛋',
      coverImage: 'https://picsum.photos/400/300?random=21',
      cookTime: 15,
      difficulty: Difficulty.EASY,
      servings: 2,
      status: RecipeStatus.PUBLISHED,
      viewCount: 1500,
      likeCount: 120,
      favoriteCount: 80,
      commentCount: 25,
      categoryName: '家常菜',
      ingredients: [
        { name: '番茄', amount: '2个' },
        { name: '鸡蛋', amount: '3个' },
        { name: '葱花', amount: '适量' },
        { name: '盐', amount: '适量' },
        { name: '糖', amount: '1勺' },
        { name: '食用油', amount: '适量' },
      ],
      steps: [
        { description: '番茄洗净切块，鸡蛋打散加少许盐', stepNumber: 1, image: 'https://picsum.photos/600/400?random=211' },
        { description: '锅中放油烧热，倒入蛋液，炒至凝固盛出', stepNumber: 2, image: 'https://picsum.photos/600/400?random=212' },
        { description: '锅中再放少许油，放入番茄块翻炒', stepNumber: 3, image: 'https://picsum.photos/600/400?random=213' },
        { description: '番茄出汁后加盐和糖调味', stepNumber: 4, image: 'https://picsum.photos/600/400?random=214' },
        { description: '倒入炒好的鸡蛋，翻炒均匀，撒上葱花即可', stepNumber: 5, image: 'https://picsum.photos/600/400?random=215' },
      ],
    },
    {
      title: '红烧肉',
      coverImage: 'https://picsum.photos/400/300?random=22',
      cookTime: 90,
      difficulty: Difficulty.MEDIUM,
      servings: 4,
      status: RecipeStatus.PUBLISHED,
      viewCount: 1350,
      likeCount: 105,
      favoriteCount: 75,
      commentCount: 20,
      categoryName: '家常菜',
      ingredients: [
        { name: '五花肉', amount: '500g' },
        { name: '冰糖', amount: '30g' },
        { name: '生抽', amount: '3勺' },
        { name: '老抽', amount: '1勺' },
        { name: '料酒', amount: '2勺' },
        { name: '八角桂皮', amount: '适量' },
      ],
      steps: [
        { description: '五花肉切成3厘米见方的块，冷水下锅焯水', stepNumber: 1, image: 'https://picsum.photos/600/400?random=221' },
        { description: '捞出洗净沥干', stepNumber: 2, image: 'https://picsum.photos/600/400?random=222' },
        { description: '锅中放少许油，放入冰糖小火炒至琥珀色', stepNumber: 3, image: 'https://picsum.photos/600/400?random=223' },
        { description: '放入五花肉翻炒上色', stepNumber: 4, image: 'https://picsum.photos/600/400?random=224' },
        { description: '加入生抽、老抽、料酒、八角、桂皮', stepNumber: 5, image: 'https://picsum.photos/600/400?random=225' },
        { description: '加入没过肉的热水，大火烧开转小火炖1小时', stepNumber: 6, image: 'https://picsum.photos/600/400?random=226' },
        { description: '大火收汁即可出锅', stepNumber: 7, image: 'https://picsum.photos/600/400?random=227' },
      ],
    },
    {
      title: '提拉米苏',
      coverImage: 'https://picsum.photos/400/300?random=23',
      cookTime: 60,
      difficulty: Difficulty.HARD,
      servings: 6,
      status: RecipeStatus.PUBLISHED,
      viewCount: 1050,
      likeCount: 88,
      favoriteCount: 65,
      commentCount: 14,
      categoryName: '甜点',
      ingredients: [
        { name: '马斯卡彭奶酪', amount: '250g' },
        { name: '蛋黄', amount: '3个' },
        { name: '细砂糖', amount: '80g' },
        { name: '淡奶油', amount: '200ml' },
        { name: '手指饼干', amount: '200g' },
        { name: '浓缩咖啡', amount: '200ml' },
      ],
      steps: [
        { description: '蛋黄加糖隔水加热打发至颜色变浅', stepNumber: 1, image: 'https://picsum.photos/600/400?random=231' },
        { description: '马斯卡彭奶酪打发至顺滑', stepNumber: 2, image: 'https://picsum.photos/600/400?random=232' },
        { description: '淡奶油打发至七分发', stepNumber: 3, image: 'https://picsum.photos/600/400?random=233' },
        { description: '将蛋黄糊、奶酪、淡奶油混合均匀', stepNumber: 4, image: 'https://picsum.photos/600/400?random=234' },
        { description: '手指饼干快速蘸咖啡，铺在容器底部', stepNumber: 5, image: 'https://picsum.photos/600/400?random=235' },
        { description: '铺上一层奶酪糊，再铺一层蘸咖啡的饼干，再铺奶酪糊', stepNumber: 6, image: 'https://picsum.photos/600/400?random=236' },
        { description: '放入冰箱冷藏4小时以上，食用前撒上可可粉', stepNumber: 7, image: 'https://picsum.photos/600/400?random=237' },
      ],
    },
    {
      title: '芒果班戟',
      coverImage: 'https://picsum.photos/400/300?random=24',
      cookTime: 45,
      difficulty: Difficulty.MEDIUM,
      servings: 6,
      status: RecipeStatus.PUBLISHED,
      viewCount: 800,
      likeCount: 62,
      favoriteCount: 48,
      commentCount: 8,
      categoryName: '甜点',
      ingredients: [
        { name: '低筋面粉', amount: '80g' },
        { name: '牛奶', amount: '200ml' },
        { name: '鸡蛋', amount: '2个' },
        { name: '黄油', amount: '15g' },
        { name: '淡奶油', amount: '200ml' },
        { name: '芒果', amount: '2个' },
      ],
      steps: [
        { description: '鸡蛋打散，加入牛奶、融化的黄油混合', stepNumber: 1, image: 'https://picsum.photos/600/400?random=241' },
        { description: '筛入低筋面粉，搅拌至无颗粒，静置20分钟', stepNumber: 2, image: 'https://picsum.photos/600/400?random=242' },
        { description: '平底锅小火，倒入面糊，摊成薄饼，煎至两面微黄', stepNumber: 3, image: 'https://picsum.photos/600/400?random=243' },
        { description: '淡奶油打发至硬性发泡', stepNumber: 4, image: 'https://picsum.photos/600/400?random=244' },
        { description: '芒果切块', stepNumber: 5, image: 'https://picsum.photos/600/400?random=245' },
        { description: '饼皮上铺奶油，放芒果块，再铺一层奶油，包成方形即可', stepNumber: 6, image: 'https://picsum.photos/600/400?random=246' },
      ],
    },
  ];

  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const userList = [admin, user1, user2];

  const recipes = [];
  for (let idx = 0; idx < recipesData.length; idx++) {
    const recipeData = recipesData[idx];
    const categoryId = categoryMap.get(recipeData.categoryName);
    const authorId = userList[idx % 3].id;

    const { ingredients, steps, categoryName, ...recipeFields } = recipeData;

    const recipe = await prisma.recipe.create({
      data: {
        ...recipeFields,
        authorId,
        categoryId,
        ingredients: {
          create: ingredients.map((ing, idx) => ({
            ...ing,
            sortOrder: idx,
          })),
        },
        steps: {
          create: steps,
        },
      },
    });
    recipes.push(recipe);
  }

  const commentContents = [
    '看起来很好吃！下次试试',
    '步骤很详细，跟着做成功了',
    '这个菜谱太棒了，收藏了',
    '请问可以用其他食材代替吗？',
    '做出来的味道和餐厅一样',
    '感谢分享，很实用',
    '图片拍得也很好看',
    '烹饪时间刚好合适',
    '配料表很准确',
    '家人都很喜欢吃',
  ];

  const replyContents = [
    '是的，非常好用',
    '可以试试，味道差不多',
    '谢谢支持！',
    '有问题随时问哦',
    '很高兴能帮到你',
  ];

  for (let i = 0; i < 20; i++) {
    const recipeIndex = i % recipes.length;
    const userIndex = i % userList.length;
    const contentIndex = i % commentContents.length;

    const comment = await prisma.comment.create({
      data: {
        content: commentContents[contentIndex],
        userId: userList[userIndex].id,
        recipeId: recipes[recipeIndex].id,
      },
    });

    if (i % 3 === 0) {
      const replyUserIndex = (userIndex + 1) % userList.length;
      await prisma.comment.create({
        data: {
          content: replyContents[i % replyContents.length],
          userId: userList[replyUserIndex].id,
          recipeId: recipes[recipeIndex].id,
          parentId: comment.id,
        },
      });
    }
  }

  for (let i = 0; i < 15; i++) {
    const recipeIndex = i % recipes.length;
    const userIndex = (i + 1) % userList.length;

    try {
      await prisma.like.create({
        data: {
          userId: userList[userIndex].id,
          recipeId: recipes[recipeIndex].id,
        },
      });
    } catch (e) {}
  }

  for (let i = 0; i < 12; i++) {
    const recipeIndex = (i + 2) % recipes.length;
    const userIndex = (i + 2) % userList.length;

    try {
      await prisma.favorite.create({
        data: {
          userId: userList[userIndex].id,
          recipeId: recipes[recipeIndex].id,
        },
      });
    } catch (e) {}
  }

  console.log('Seeding completed!');
  console.log('Created:');
  console.log(`  - ${categories.length} categories`);
  console.log(`  - 3 users (1 admin, 2 regular)`);
  console.log(`  - ${recipes.length} recipes`);
  console.log('  - Comments with replies');
  console.log('  - Likes and favorites');
  console.log('\nDefault credentials:');
  console.log('  Admin: admin / 123456');
  console.log('  User1: cook_master / 123456');
  console.log('  User2: food_lover / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
