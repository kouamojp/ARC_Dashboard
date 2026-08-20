import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-docs-deployment',
  templateUrl: './deployment.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentComponent {
  protected readonly buildRoot = `ng build --configuration production`;

  protected readonly buildSub = `npm run build:prod`;

  protected readonly nginx = `location /arcreances/ {
    try_files $uri $uri/ /arcreances/index.html;
}`;

  protected readonly htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /arcreances/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /arcreances/index.html [L]
</IfModule>`;
}
